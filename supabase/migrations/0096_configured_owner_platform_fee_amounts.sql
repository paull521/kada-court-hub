-- Owner-payment platform-fee rows follow each division's configured amount.
-- WAPinoy uses $0.00 while keeping the informational Platform Fee line visible.

create or replace function public.ensure_owner_payment_ledger(p_conference_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare
  v_month date:=date_trunc('month',current_date)::date;
  v_season record;
  v_platform_fee_cents integer;
begin
  if not (public.is_platform_creator() or public.user_has_conference_role(p_conference_id,array['owner']::public.conference_role[])) then
    raise exception 'Owner or Platform Creator access is required.';
  end if;

  insert into public.owner_payment_ledger(conference_id,ledger_key,charge_type,label,amount_cents,due_on)
  values(
    p_conference_id,'subscription:'||to_char(v_month,'YYYY-MM'),'subscription',
    'Monthly subscription - '||to_char(v_month,'FMMonth YYYY'),5000,v_month
  )
  on conflict(conference_id,ledger_key) where ledger_key is not null do nothing;

  if exists(
    select 1 from public.owner_payment_ledger
    where conference_id=p_conference_id and ledger_key='platform-fee:manual-test'
  ) then
    return;
  end if;

  for v_season in
    select season.id,season.name
    from public.seasons season
    where season.conference_id=p_conference_id
      and season.archived_at is null
      and season.canceled_at is null
      and season.starts_on<=current_date
      and season.ends_on>=current_date
  loop
    select coalesce(sum(coalesce(financial.platform_fee_cents,100)),0)::integer
      into v_platform_fee_cents
    from public.registrations registration
    left join public.division_financial_settings financial on financial.division_id=registration.division_id
    where registration.season_id=v_season.id
      and registration.status='active';

    insert into public.owner_payment_ledger(conference_id,ledger_key,charge_type,label,amount_cents,due_on)
    values(
      p_conference_id,'platform-fee:'||v_season.id,'platform_fee',
      'Platform fee - '||v_season.name,v_platform_fee_cents,current_date
    )
    on conflict(conference_id,ledger_key) where ledger_key is not null do update
      set amount_cents=excluded.amount_cents,updated_at=now()
      where public.owner_payment_ledger.paid_cents=0;
  end loop;
end;
$$;

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
  ) order by entry.due_on nulls last,entry.created_at),'[]'::jsonb)
    into v_entries
  from public.owner_payment_ledger entry
  where entry.conference_id=p_conference_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',submission.id,'amountCents',submission.amount_cents,'method',submission.method,
    'status',submission.status,'submittedAt',submission.submitted_at,'reviewedAt',submission.reviewed_at
  ) order by submission.submitted_at desc),'[]'::jsonb)
    into v_submissions
  from public.conference_subscription_payment_submissions submission
  where submission.conference_id=p_conference_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'divisionName',division.name,'activePlayers',counts.players,
    'platformFeeCents',counts.players*coalesce(financial.platform_fee_cents,100)
  ) order by division.name),'[]'::jsonb)
    into v_divisions
  from public.divisions division
  join public.seasons season on season.id=division.season_id
  left join public.division_financial_settings financial on financial.division_id=division.id
  left join lateral(
    select count(*)::integer as players
    from public.registrations registration
    where registration.division_id=division.id and registration.status='active'
  ) counts on true
  where season.conference_id=p_conference_id
    and season.archived_at is null
    and season.canceled_at is null
    and season.starts_on<=current_date
    and season.ends_on>=current_date;

  return jsonb_build_object('entries',v_entries,'submissions',v_submissions,'divisions',v_divisions);
end;
$$;

revoke all on function public.ensure_owner_payment_ledger(uuid),public.owner_payment_billing(uuid) from public;
grant execute on function public.ensure_owner_payment_ledger(uuid),public.owner_payment_billing(uuid) to authenticated;
