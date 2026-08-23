-- Players may request a fee waiver with a mandatory comment.
-- Owners approve or decline it through the existing payment review queue.

alter table public.payment_submissions
  drop constraint if exists payment_submissions_method_check;
alter table public.payment_submissions
  add constraint payment_submissions_method_check
  check (method in ('zelle','cash','waiver'));

create or replace function public.player_submit_payment_notice(
  p_fee_id uuid,
  p_method text,
  p_reference text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid;
  v_amount_cents integer;
  v_description text;
  v_conference_id uuid;
  v_submission_id uuid;
  v_reference text := nullif(trim(p_reference), '');
begin
  if p_method not in ('zelle','cash','waiver') then raise exception 'Choose Zelle, cash, or waiver.'; end if;
  if p_method='waiver' and v_reference is null then raise exception 'A comment is required for a waiver request.'; end if;
  if char_length(coalesce(v_reference,''))>200 then raise exception 'Enter a shorter comment or payment reference.'; end if;

  select player.profile_id,fee.amount_cents,fee.description,season.conference_id
    into v_profile_id,v_amount_cents,v_description,v_conference_id
  from public.fees fee
  join public.registrations registration on registration.id=fee.registration_id
  join public.player_profiles player on player.id=registration.player_id
  join public.seasons season on season.id=registration.season_id
  where fee.id=p_fee_id and fee.status='due';

  if v_profile_id is null or v_profile_id<>(select auth.uid()) then
    raise exception 'This due fee does not belong to the signed-in player.';
  end if;
  if exists(select 1 from public.payment_submissions where fee_id=p_fee_id and status='pending') then
    raise exception 'This fee already has a request awaiting owner review.';
  end if;

  insert into public.payment_submissions(fee_id,profile_id,amount_cents,method,reference)
  values(p_fee_id,v_profile_id,v_amount_cents,p_method,v_reference)
  returning id into v_submission_id;

  insert into public.notifications(profile_id,notification_type,title,body,link_path,entity_id)
  select membership.profile_id,'payment_submitted',
         case when p_method='waiver' then 'Waiver request needs review' else 'Payment needs review' end,
         case when p_method='waiver' then v_description||' waiver requested: '||v_reference else v_description||' payment was submitted for confirmation.' end,
         '/owner/payments',v_submission_id
  from public.conference_memberships membership
  where membership.conference_id=v_conference_id and membership.role='owner'
  on conflict(profile_id,notification_type,entity_id) do update
    set title=excluded.title,body=excluded.body,link_path=excluded.link_path,read_at=null,created_at=now();
  return v_submission_id;
end;
$$;

create or replace function public.owner_review_payment_notice(
  p_submission_id uuid,
  p_decision text,
  p_review_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conference_id uuid;
  v_profile_id uuid;
  v_fee_id uuid;
  v_amount_cents integer;
  v_method text;
  v_reference text;
  v_description text;
  v_status text;
  v_note text := nullif(trim(p_review_note),'');
begin
  if p_decision not in ('confirmed','declined') then raise exception 'Choose Approve or Decline.'; end if;
  if p_decision='declined' and v_note is null then raise exception 'Add a reason when declining a request.'; end if;
  if char_length(coalesce(v_note,''))>500 then raise exception 'Enter a shorter review note.'; end if;

  select season.conference_id,submission.profile_id,submission.fee_id,
         submission.amount_cents,submission.method,submission.reference,
         fee.description,submission.status
    into v_conference_id,v_profile_id,v_fee_id,v_amount_cents,v_method,
         v_reference,v_description,v_status
  from public.payment_submissions submission
  join public.fees fee on fee.id=submission.fee_id
  join public.registrations registration on registration.id=fee.registration_id
  join public.seasons season on season.id=registration.season_id
  where submission.id=p_submission_id for update;

  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then
    raise exception 'Only the conference owner can review this request.';
  end if;
  if v_status<>'pending' then raise exception 'This request was already reviewed.'; end if;

  update public.payment_submissions
  set status=p_decision,review_note=v_note,reviewed_by=(select auth.uid()),reviewed_at=now()
  where id=p_submission_id;

  if p_decision='confirmed' and v_method='waiver' then
    update public.fees set status='waived' where id=v_fee_id and status='due';
  elsif p_decision='confirmed' then
    insert into public.payments(fee_id,amount_cents,method,recorded_by,note)
    values(v_fee_id,v_amount_cents,v_method,(select auth.uid()),concat_ws(' · ',v_reference,v_note));
    update public.fees set status='paid' where id=v_fee_id;
  end if;

  insert into public.notifications(profile_id,notification_type,title,body,link_path,entity_id)
  values(v_profile_id,'payment_reviewed',
    case
      when v_method='waiver' and p_decision='confirmed' then 'Waiver approved'
      when v_method='waiver' then 'Waiver request declined'
      when p_decision='confirmed' then 'Payment confirmed'
      else 'Payment needs attention'
    end,
    case
      when v_method='waiver' and p_decision='confirmed' then v_description||' was waived.'
      when v_method='waiver' then coalesce(v_note,'The waiver request was declined.')
      when p_decision='confirmed' then v_description||' is paid.'
      else coalesce(v_note,v_description||' was not confirmed.')
    end,
    '/payments',p_submission_id)
  on conflict(profile_id,notification_type,entity_id) do update
    set title=excluded.title,body=excluded.body,link_path=excluded.link_path,read_at=null,created_at=now();

  insert into public.activity_log(conference_id,actor_profile_id,action,entity_type,entity_id,summary)
  values(v_conference_id,(select auth.uid()),p_decision,
    case when v_method='waiver' then 'waiver_request' else 'payment_submission' end,
    p_submission_id::text,
    case when v_method='waiver' then 'Waiver request '||p_decision else 'Payment notice '||p_decision end);
end;
$$;

revoke all on function public.player_submit_payment_notice(uuid,text,text) from public;
revoke all on function public.owner_review_payment_notice(uuid,text,text) from public;
grant execute on function public.player_submit_payment_notice(uuid,text,text) to authenticated;
grant execute on function public.owner_review_payment_notice(uuid,text,text) to authenticated;
