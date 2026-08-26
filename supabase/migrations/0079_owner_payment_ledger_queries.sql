-- Ledger-backed owner and Platform Creator billing read models.
-- Charges are created from the live conference context; payment submissions only
-- record a claimed transfer and are applied oldest-first after creator confirmation.
alter table public.owner_payment_ledger add column if not exists ledger_key text;
create unique index if not exists owner_payment_ledger_key_idx
  on public.owner_payment_ledger(conference_id,ledger_key) where ledger_key is not null;

create or replace function public.ensure_owner_payment_ledger(p_conference_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare
  v_month date:=date_trunc('month',current_date)::date;
  v_season record;
  v_players integer;
begin
  if not (public.is_platform_creator() or public.user_has_conference_role(p_conference_id,array['owner']::public.conference_role[])) then
    raise exception 'Owner or Platform Creator access is required.';
  end if;

  insert into public.owner_payment_ledger(conference_id,ledger_key,charge_type,label,amount_cents,due_on)
  values(p_conference_id,'subscription:'||to_char(v_month,'YYYY-MM'),'subscription',
    'Monthly subscription - '||to_char(v_month,'FMMonth YYYY'),5000,v_month)
  on conflict(conference_id,ledger_key) where ledger_key is not null do nothing;

  for v_season in
    select season.id,season.name from public.seasons season
    where season.conference_id=p_conference_id and season.archived_at is null and season.canceled_at is null
      and season.starts_on<=current_date and season.ends_on>=current_date
  loop
    select count(*) into v_players from public.registrations registration
      join public.divisions division on division.id=registration.division_id
      where registration.season_id=v_season.id and registration.status='active';
    insert into public.owner_payment_ledger(conference_id,ledger_key,charge_type,label,amount_cents,due_on)
    values(p_conference_id,'platform-fee:'||v_season.id,'platform_fee',
      'Platform fee - '||v_season.name,v_players*100,current_date)
    on conflict(conference_id,ledger_key) where ledger_key is not null do update
      set amount_cents=excluded.amount_cents,updated_at=now()
      where public.owner_payment_ledger.paid_cents=0;
  end loop;
end;$$;

create or replace function public.owner_payment_billing(p_conference_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_entries jsonb; v_submissions jsonb; v_divisions jsonb;
begin
  if not public.user_has_conference_role(p_conference_id,array['owner']::public.conference_role[]) then
    raise exception 'Owner access is required.';
  end if;
  perform public.ensure_owner_payment_ledger(p_conference_id);
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',entry.id,'chargeType',entry.charge_type,'label',entry.label,
    'amountCents',entry.amount_cents,'paidCents',entry.paid_cents,
    'balanceCents',entry.amount_cents-entry.paid_cents,'status',entry.status,'dueOn',entry.due_on
  ) order by entry.due_on nulls last,entry.created_at),'[]'::jsonb) into v_entries
  from public.owner_payment_ledger entry where entry.conference_id=p_conference_id;
  select coalesce(jsonb_agg(jsonb_build_object('id',submission.id,'amountCents',submission.amount_cents,
    'method',submission.method,'status',submission.status,'submittedAt',submission.submitted_at,
    'reviewedAt',submission.reviewed_at) order by submission.submitted_at desc),'[]'::jsonb) into v_submissions
  from public.conference_subscription_payment_submissions submission where submission.conference_id=p_conference_id;
  select coalesce(jsonb_agg(jsonb_build_object('divisionName',division.name,'activePlayers',counts.players,
    'platformFeeCents',counts.players*100) order by division.name),'[]'::jsonb) into v_divisions
  from public.divisions division join public.seasons season on season.id=division.season_id
  left join lateral(select count(*)::integer as players from public.registrations registration
    where registration.division_id=division.id and registration.status='active') counts on true
  where season.conference_id=p_conference_id and season.archived_at is null and season.canceled_at is null
    and season.starts_on<=current_date and season.ends_on>=current_date;
  return jsonb_build_object('entries',v_entries,'submissions',v_submissions,'divisions',v_divisions);
end;$$;

create or replace function public.platform_owner_payment_billing()
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_conference record; v_result jsonb:='[]'::jsonb; v_billing jsonb; v_owner record;
begin
  if not public.is_platform_creator() then return '[]'::jsonb; end if;
  for v_conference in select conference.id,conference.name from public.conferences conference
    join public.platform_owner_records owner on owner.conference_id=conference.id
    where owner.status in ('active','suspended') and coalesce(conference.is_test,false)=false order by conference.name
  loop
    perform public.ensure_owner_payment_ledger(v_conference.id);
    select owner.full_name,owner.email,owner.phone into v_owner from public.platform_owner_records owner where owner.conference_id=v_conference.id;
    select jsonb_build_object(
      'entries',coalesce(jsonb_agg(jsonb_build_object('id',entry.id,'chargeType',entry.charge_type,'label',entry.label,
        'amountCents',entry.amount_cents,'paidCents',entry.paid_cents,'balanceCents',entry.amount_cents-entry.paid_cents,
        'status',entry.status,'dueOn',entry.due_on) order by entry.due_on nulls last,entry.created_at),'[]'::jsonb),
      'submissions',(select coalesce(jsonb_agg(jsonb_build_object('id',submission.id,'amountCents',submission.amount_cents,
        'method',submission.method,'status',submission.status,'submittedAt',submission.submitted_at) order by submission.submitted_at desc),'[]'::jsonb)
        from public.conference_subscription_payment_submissions submission where submission.conference_id=v_conference.id)
    ) into v_billing from public.owner_payment_ledger entry where entry.conference_id=v_conference.id;
    v_result:=v_result||jsonb_build_array(jsonb_build_object('conferenceId',v_conference.id,'conferenceName',v_conference.name,
      'ownerName',v_owner.full_name,'email',v_owner.email,'phone',v_owner.phone,'billing',v_billing));
  end loop;
  return v_result;
end;$$;

-- Ensure a payment submitted through any supported KCH screen always has its
-- current charges available before the existing oldest-outstanding allocation.
create or replace function public.platform_review_subscription_payment(p_submission_id uuid,p_decision text)
returns void language plpgsql security definer set search_path='' as $$
declare v_submission public.conference_subscription_payment_submissions%rowtype;
begin
  if not public.is_platform_creator() then raise exception 'Platform Creator access is required.'; end if;
  if p_decision not in('confirmed','declined') then raise exception 'Choose Confirmed or Declined.'; end if;
  select * into v_submission from public.conference_subscription_payment_submissions where id=p_submission_id for update;
  if v_submission.id is null or v_submission.status<>'pending' then raise exception 'Payment submission is not available.'; end if;
  update public.conference_subscription_payment_submissions set status=p_decision,reviewed_by=(select auth.uid()),reviewed_at=now() where id=v_submission.id;
  if p_decision='confirmed' then
    perform public.ensure_owner_payment_ledger(v_submission.conference_id);
    perform public.apply_confirmed_owner_payment(v_submission.conference_id,v_submission.amount_cents);
    insert into public.conference_subscriptions(conference_id,status,paid_through,updated_at)
    values(v_submission.conference_id,'paid',(current_date+interval '1 month')::date,now())
    on conflict(conference_id) do update set status='paid',paid_through=greatest(coalesce(conference_subscriptions.paid_through,current_date),(current_date+interval '1 month')::date),updated_at=now();
  end if;
end;$$;

create or replace function public.owner_submit_subscription_payment(p_conference_id uuid,p_amount_cents integer,p_method text)
returns void language plpgsql security definer set search_path='' as $$
declare v_balance integer;
begin
  if not public.user_has_conference_role(p_conference_id,array['owner']::public.conference_role[]) then raise exception 'Only the conference owner can submit this payment.'; end if;
  if p_amount_cents<1 or p_method not in('zelle','cash') then raise exception 'Choose a valid payment amount and method.'; end if;
  if exists(select 1 from public.conference_subscription_payment_submissions where conference_id=p_conference_id and status='pending') then raise exception 'A subscription payment is already awaiting confirmation.'; end if;
  perform public.ensure_owner_payment_ledger(p_conference_id);
  select coalesce(sum(amount_cents-paid_cents),0) into v_balance from public.owner_payment_ledger where conference_id=p_conference_id and status<>'paid';
  if p_amount_cents>v_balance then raise exception 'The amount sent cannot be more than the current balance due.'; end if;
  insert into public.conference_subscription_payment_submissions(conference_id,submitted_by,amount_cents,method)
  values(p_conference_id,(select auth.uid()),p_amount_cents,p_method);
end;$$;

revoke all on function public.ensure_owner_payment_ledger(uuid),public.owner_payment_billing(uuid),public.platform_owner_payment_billing() from public;
grant execute on function public.ensure_owner_payment_ledger(uuid),public.owner_payment_billing(uuid),public.platform_owner_payment_billing() to authenticated;
