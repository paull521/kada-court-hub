-- One login can own multiple conferences. Platform status is stored per conference.
alter table public.platform_owner_records drop constraint if exists platform_owner_records_profile_id_key;
alter table public.platform_owner_records drop constraint if exists platform_owner_records_email_key;
create index if not exists platform_owner_records_profile_idx on public.platform_owner_records(profile_id);
create index if not exists platform_owner_records_email_idx on public.platform_owner_records(lower(email));

-- Preserve the two test conferences and make the established Seattle conference
-- the main KCH Bball demo conference.
update public.conferences set name='KCH Bball Test' where name='KCH Bball';
update public.conferences set name='KCH Bball' where name='Seattle Filipino Basketball League';

-- Give every existing owner/conference relationship its own management record.
insert into public.platform_owner_records(conference_id,profile_id,full_name,email,phone,status,subscription_starts_on)
select membership.conference_id,membership.profile_id,profile.display_name,
  lower(profile.id::text)||'@kch.local',coalesce(profile.mobile,''),'active',current_date
from public.conference_memberships membership
join public.profiles profile on profile.id=membership.profile_id
where membership.role='owner'
  and not exists(select 1 from public.platform_owner_records record where record.conference_id=membership.conference_id);

-- KCH Bball payment-test baseline: $50 subscription paid, $30 platform fee due.
do $$
declare v_conference_id uuid;
begin
  select id into v_conference_id from public.conferences where name='KCH Bball' order by created_at limit 1;
  if v_conference_id is null then raise exception 'KCH Bball conference was not found.'; end if;
  delete from public.conference_subscription_payment_submissions where conference_id=v_conference_id and status='pending';
  delete from public.owner_payment_ledger where conference_id=v_conference_id;
  insert into public.owner_payment_ledger(conference_id,ledger_key,charge_type,label,amount_cents,paid_cents,status,due_on)
  values
    (v_conference_id,'subscription:'||to_char(date_trunc('month',current_date),'YYYY-MM'),'subscription','Monthly subscription - '||to_char(date_trunc('month',current_date),'FMMonth YYYY'),5000,5000,'paid',date_trunc('month',current_date)::date),
    (v_conference_id,'platform-fee:manual-test','platform_fee','Platform fee - test balance',3000,0,'due',current_date);
end;$$;

-- A manual test platform-fee entry intentionally remains fixed while it is tested.
create or replace function public.ensure_owner_payment_ledger(p_conference_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_month date:=date_trunc('month',current_date)::date; v_season record; v_players integer;
begin
  if not (public.is_platform_creator() or public.user_has_conference_role(p_conference_id,array['owner']::public.conference_role[])) then raise exception 'Owner or Platform Creator access is required.'; end if;
  insert into public.owner_payment_ledger(conference_id,ledger_key,charge_type,label,amount_cents,due_on)
  values(p_conference_id,'subscription:'||to_char(v_month,'YYYY-MM'),'subscription','Monthly subscription - '||to_char(v_month,'FMMonth YYYY'),5000,v_month)
  on conflict(conference_id,ledger_key) where ledger_key is not null do nothing;
  if exists(select 1 from public.owner_payment_ledger where conference_id=p_conference_id and ledger_key='platform-fee:manual-test') then return; end if;
  for v_season in select season.id,season.name from public.seasons season where season.conference_id=p_conference_id and season.archived_at is null and season.canceled_at is null and season.starts_on<=current_date and season.ends_on>=current_date loop
    select count(*) into v_players from public.registrations registration join public.divisions division on division.id=registration.division_id where registration.season_id=v_season.id and registration.status='active';
    insert into public.owner_payment_ledger(conference_id,ledger_key,charge_type,label,amount_cents,due_on)
    values(p_conference_id,'platform-fee:'||v_season.id,'platform_fee','Platform fee - '||v_season.name,v_players*100,current_date)
    on conflict(conference_id,ledger_key) where ledger_key is not null do update set amount_cents=excluded.amount_cents,updated_at=now() where public.owner_payment_ledger.paid_cents=0;
  end loop;
end;$$;

create or replace function public.platform_owner_payment_billing()
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_conference record; v_result jsonb:='[]'::jsonb; v_billing jsonb; v_owner record;
begin
  if not public.is_platform_creator() then return '[]'::jsonb; end if;
  for v_conference in select conference.id,conference.name from public.conferences conference join public.platform_owner_records owner on owner.conference_id=conference.id where coalesce(conference.is_test,false)=false order by conference.name loop
    perform public.ensure_owner_payment_ledger(v_conference.id);
    select coalesce(owner.full_name,profile.display_name,'Conference Owner') as full_name,coalesce(owner.email,'') as email,coalesce(owner.phone,'') as phone into v_owner
    from public.platform_owner_records owner left join public.profiles profile on profile.id=owner.profile_id where owner.conference_id=v_conference.id order by owner.created_at limit 1;
    select jsonb_build_object('entries',coalesce(jsonb_agg(jsonb_build_object('id',entry.id,'chargeType',entry.charge_type,'label',entry.label,'amountCents',entry.amount_cents,'paidCents',entry.paid_cents,'balanceCents',entry.amount_cents-entry.paid_cents,'status',entry.status,'dueOn',entry.due_on) order by entry.due_on nulls last,entry.created_at),'[]'::jsonb),'submissions',(select coalesce(jsonb_agg(jsonb_build_object('id',submission.id,'amountCents',submission.amount_cents,'method',submission.method,'status',submission.status,'submittedAt',submission.submitted_at) order by submission.submitted_at desc),'[]'::jsonb) from public.conference_subscription_payment_submissions submission where submission.conference_id=v_conference.id)) into v_billing from public.owner_payment_ledger entry where entry.conference_id=v_conference.id;
    v_result:=v_result||jsonb_build_array(jsonb_build_object('conferenceId',v_conference.id,'conferenceName',v_conference.name,'ownerName',coalesce(v_owner.full_name,'Conference Owner'),'email',coalesce(v_owner.email,''),'phone',coalesce(v_owner.phone,''),'billing',v_billing));
  end loop;
  return v_result;
end;$$;

revoke all on function public.ensure_owner_payment_ledger(uuid),public.platform_owner_payment_billing() from public;
grant execute on function public.ensure_owner_payment_ledger(uuid),public.platform_owner_payment_billing() to authenticated;
