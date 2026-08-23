-- A payment submission can be account-level (without a fee), so its fee join
-- is nullable. Lock only the submission row during review.
create or replace function public.owner_review_payment_notice(p_submission_id uuid,p_decision text,p_review_note text default null)
returns void language plpgsql security definer set search_path=''
as $$
declare v_conference_id uuid;v_profile_id uuid;v_registration_id uuid;v_amount_cents integer;v_method text;v_reference text;v_status text;v_note text:=nullif(trim(p_review_note),'');
begin
  if p_decision not in('confirmed','declined') then raise exception 'Choose Confirm or Decline.'; end if;
  if p_decision='declined' and v_note is null then raise exception 'Add a reason when declining a request.'; end if;
  if char_length(coalesce(v_note,''))>500 then raise exception 'Enter a shorter review note.'; end if;
  select season.conference_id,submission.profile_id,coalesce(submission.registration_id,fee.registration_id),submission.amount_cents,submission.method,submission.reference,submission.status
  into v_conference_id,v_profile_id,v_registration_id,v_amount_cents,v_method,v_reference,v_status
  from public.payment_submissions submission left join public.fees fee on fee.id=submission.fee_id join public.registrations registration on registration.id=coalesce(submission.registration_id,fee.registration_id) join public.seasons season on season.id=registration.season_id
  where submission.id=p_submission_id for update of submission;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then raise exception 'Only the conference owner can review this request.'; end if;
  if v_status<>'pending' then raise exception 'This request was already reviewed.'; end if;
  update public.payment_submissions set status=p_decision,review_note=v_note,reviewed_by=(select auth.uid()),reviewed_at=now() where id=p_submission_id;
  if p_decision='confirmed' and v_method='waiver' then
    insert into public.registration_waivers(registration_id,amount_cents,reason,approved_by) values(v_registration_id,v_amount_cents,coalesce(v_reference,v_note,'Approved waiver'),(select auth.uid()));
  elsif p_decision='confirmed' then
    insert into public.payments(registration_id,fee_id,amount_cents,method,recorded_by,note) values(v_registration_id,null,v_amount_cents,v_method,(select auth.uid()),concat_ws(' · ',v_reference,v_note));
  end if;
  insert into public.notifications(profile_id,notification_type,title,body,link_path,entity_id)
  values(v_profile_id,'payment_reviewed',case when p_decision='confirmed' then case when v_method='waiver' then 'Waiver approved' else 'Payment confirmed' end else 'Payment needs attention' end,
    case when p_decision='confirmed' then '$'||to_char(v_amount_cents/100.0,'FM999999990.00')||case when v_method='waiver' then ' was waived.' else ' was confirmed.' end else coalesce(v_note,'The request was declined.') end,'/payments',p_submission_id)
  on conflict(profile_id,notification_type,entity_id) do update set title=excluded.title,body=excluded.body,link_path=excluded.link_path,read_at=null,created_at=now();
end;
$$;

revoke all on function public.owner_review_payment_notice(uuid,text,text) from public;
grant execute on function public.owner_review_payment_notice(uuid,text,text) to authenticated;
