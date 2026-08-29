-- KCH owner pricing: first season is a free pilot; later seasons charge a
-- $50 season subscription and $3 for every active player in every division.
-- Player-facing league fees remain the conference owner's single collection.

alter table public.conference_subscriptions
  add column if not exists season_amount_cents integer not null default 5000,
  add column if not exists player_division_amount_cents integer not null default 300,
  add column if not exists pilot_season_id uuid references public.seasons(id) on delete set null;

update public.conference_subscriptions
set season_amount_cents=5000,
    player_division_amount_cents=300
where season_amount_cents<>5000 or player_division_amount_cents<>300;

-- Preserve prior payments as history, but remove unpaid monthly and old $1
-- per-player obligations now replaced by the season model.
update public.owner_payment_ledger
set amount_cents=paid_cents,
    status='paid',
    label=case
      when charge_type='subscription' then 'Legacy monthly subscription'
      else 'Legacy player access'
    end,
    updated_at=now()
where ledger_key like 'subscription:%'
   or ledger_key like 'platform-fee:%';

create or replace function public.block_player_platform_fee()
returns trigger language plpgsql set search_path='' as $$
begin
  if new.category='platform' then return null; end if;
  return new;
end;
$$;

drop trigger if exists block_player_platform_fee on public.fees;
create trigger block_player_platform_fee
before insert on public.fees
for each row execute function public.block_player_platform_fee();

create or replace function public.ensure_owner_payment_ledger(p_conference_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare
  v_subscription public.conference_subscriptions%rowtype;
  v_season record;
  v_players integer;
  v_first_season_id uuid;
  v_is_pilot boolean;
begin
  if not (public.is_platform_creator() or public.user_has_conference_role(p_conference_id,array['owner']::public.conference_role[])) then
    raise exception 'Owner or Platform Creator access is required.';
  end if;

  insert into public.conference_subscriptions(conference_id)
  values(p_conference_id)
  on conflict(conference_id) do nothing;

  select * into v_subscription
  from public.conference_subscriptions
  where conference_id=p_conference_id
  for update;

  select season.id into v_first_season_id
  from public.seasons season
  where season.conference_id=p_conference_id
    and season.canceled_at is null
  order by season.starts_on,season.created_at,season.id
  limit 1;

  if v_subscription.pilot_season_id is null and v_first_season_id is not null then
    update public.conference_subscriptions
    set pilot_season_id=v_first_season_id,updated_at=now()
    where conference_id=p_conference_id;
    v_subscription.pilot_season_id:=v_first_season_id;
  end if;

  for v_season in
    select season.id,season.name,season.starts_on
    from public.seasons season
    where season.conference_id=p_conference_id
      and season.archived_at is null
      and season.canceled_at is null
      and season.starts_on<=current_date
      and season.ends_on>=current_date
    order by season.starts_on,season.name
  loop
    select count(*)::integer into v_players
    from public.registrations registration
    where registration.season_id=v_season.id
      and registration.status='active';

    if v_players=0 then continue; end if;
    v_is_pilot:=v_season.id=v_subscription.pilot_season_id;

    insert into public.owner_payment_ledger(conference_id,ledger_key,charge_type,label,amount_cents,due_on)
    values(
      p_conference_id,'season-subscription:'||v_season.id,'subscription',
      case when v_is_pilot then 'Pilot season subscription - '||v_season.name else 'Season subscription - '||v_season.name end,
      case when v_is_pilot then 0 else v_subscription.season_amount_cents end,v_season.starts_on
    )
    on conflict(conference_id,ledger_key) where ledger_key is not null do update
      set amount_cents=excluded.amount_cents,label=excluded.label,due_on=excluded.due_on,updated_at=now()
      where public.owner_payment_ledger.paid_cents=0;

    insert into public.owner_payment_ledger(conference_id,ledger_key,charge_type,label,amount_cents,due_on)
    values(
      p_conference_id,'player-access:'||v_season.id,'platform_fee',
      case when v_is_pilot then 'Pilot player access - '||v_season.name else 'Player access - '||v_season.name end,
      case when v_is_pilot then 0 else v_players*v_subscription.player_division_amount_cents end,v_season.starts_on
    )
    on conflict(conference_id,ledger_key) where ledger_key is not null do update
      set amount_cents=excluded.amount_cents,label=excluded.label,due_on=excluded.due_on,updated_at=now()
      where public.owner_payment_ledger.paid_cents=0;
  end loop;
end;
$$;

create or replace function public.owner_payment_billing(p_conference_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_entries jsonb; v_submissions jsonb; v_divisions jsonb; v_pilot_season_id uuid;
begin
  if not public.user_has_conference_role(p_conference_id,array['owner']::public.conference_role[]) then
    raise exception 'Owner access is required.';
  end if;
  perform public.ensure_owner_payment_ledger(p_conference_id);
  select pilot_season_id into v_pilot_season_id from public.conference_subscriptions where conference_id=p_conference_id;

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
    'platformFeeCents',case when season.id=v_pilot_season_id then 0 else counts.players*300 end
  ) order by season.starts_on,division.name),'[]'::jsonb)
  into v_divisions
  from public.divisions division
  join public.seasons season on season.id=division.season_id
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

create or replace function public.platform_owner_payment_billing()
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_conference record; v_result jsonb:='[]'::jsonb; v_billing jsonb; v_owner record;
begin
  if not public.is_platform_creator() then return '[]'::jsonb; end if;
  for v_conference in
    select conference.id,conference.name
    from public.conferences conference
    join public.platform_owner_records owner on owner.conference_id=conference.id
    order by conference.name
  loop
    perform public.ensure_owner_payment_ledger(v_conference.id);
    select coalesce(owner.full_name,profile.display_name,'Conference Owner') as full_name,
      coalesce(nullif(login.email,''),nullif(owner.email,''),'') as email,
      coalesce(owner.phone,'') as phone
    into v_owner
    from public.platform_owner_records owner
    left join public.profiles profile on profile.id=owner.profile_id
    left join auth.users login on login.id=owner.profile_id
    where owner.conference_id=v_conference.id
    order by owner.created_at limit 1;

    select jsonb_build_object(
      'entries',coalesce(jsonb_agg(jsonb_build_object(
        'id',entry.id,'chargeType',entry.charge_type,'label',entry.label,
        'amountCents',entry.amount_cents,'paidCents',entry.paid_cents,
        'balanceCents',entry.amount_cents-entry.paid_cents,'status',entry.status,'dueOn',entry.due_on
      ) order by entry.due_on nulls last,entry.created_at),'[]'::jsonb),
      'submissions',(select coalesce(jsonb_agg(jsonb_build_object(
        'id',submission.id,'amountCents',submission.amount_cents,'method',submission.method,
        'status',submission.status,'submittedAt',submission.submitted_at,'reviewedAt',submission.reviewed_at
      ) order by submission.submitted_at desc),'[]'::jsonb)
      from public.conference_subscription_payment_submissions submission where submission.conference_id=v_conference.id)
    ) into v_billing
    from public.owner_payment_ledger entry
    where entry.conference_id=v_conference.id;

    v_result:=v_result||jsonb_build_array(jsonb_build_object(
      'conferenceId',v_conference.id,'conferenceName',v_conference.name,
      'ownerName',coalesce(v_owner.full_name,'Conference Owner'),'email',coalesce(v_owner.email,''),
      'phone',coalesce(v_owner.phone,''),'billing',v_billing
    ));
  end loop;
  return v_result;
end;
$$;

create or replace function public.platform_review_subscription_payment(p_submission_id uuid,p_decision text)
returns void language plpgsql security definer set search_path='' as $$
declare v_submission public.conference_subscription_payment_submissions%rowtype; v_paid_through date;
begin
  if not public.is_platform_creator() then raise exception 'Platform Creator access is required.'; end if;
  if p_decision not in('confirmed','declined') then raise exception 'Choose Confirmed or Declined.'; end if;
  select * into v_submission from public.conference_subscription_payment_submissions where id=p_submission_id for update;
  if v_submission.id is null or v_submission.status<>'pending' then raise exception 'Payment submission is not available.'; end if;
  update public.conference_subscription_payment_submissions set status=p_decision,reviewed_by=(select auth.uid()),reviewed_at=now() where id=v_submission.id;
  if p_decision='confirmed' then
    perform public.ensure_owner_payment_ledger(v_submission.conference_id);
    perform public.apply_confirmed_owner_payment(v_submission.conference_id,v_submission.amount_cents);
    select max(season.ends_on) into v_paid_through from public.seasons season
      where season.conference_id=v_submission.conference_id and season.starts_on<=current_date and season.ends_on>=current_date and season.canceled_at is null;
    insert into public.conference_subscriptions(conference_id,status,paid_through,updated_at)
    values(v_submission.conference_id,'paid',v_paid_through,now())
    on conflict(conference_id) do update set status='paid',paid_through=greatest(coalesce(conference_subscriptions.paid_through,current_date),coalesce(excluded.paid_through,current_date)),updated_at=now();
  end if;
end;
$$;

create or replace function public.owner_submit_subscription_payment(p_conference_id uuid,p_amount_cents integer,p_method text)
returns void language plpgsql security definer set search_path='' as $$
declare v_balance integer;
begin
  if not public.user_has_conference_role(p_conference_id,array['owner']::public.conference_role[]) then raise exception 'Only the conference owner can submit this payment.'; end if;
  if p_amount_cents<1 or p_method not in('zelle','cash') then raise exception 'Choose a valid payment amount and method.'; end if;
  if exists(select 1 from public.conference_subscription_payment_submissions where conference_id=p_conference_id and status='pending') then raise exception 'A season payment is already awaiting confirmation.'; end if;
  perform public.ensure_owner_payment_ledger(p_conference_id);
  select coalesce(sum(amount_cents-paid_cents),0) into v_balance from public.owner_payment_ledger where conference_id=p_conference_id and status<>'paid';
  if p_amount_cents>v_balance then raise exception 'The amount sent cannot be more than the current balance due.'; end if;
  insert into public.conference_subscription_payment_submissions(conference_id,submitted_by,amount_cents,method)
  values(p_conference_id,(select auth.uid()),p_amount_cents,p_method);
end;
$$;

revoke all on function public.ensure_owner_payment_ledger(uuid),public.owner_payment_billing(uuid),public.platform_owner_payment_billing() from public;
grant execute on function public.ensure_owner_payment_ledger(uuid),public.owner_payment_billing(uuid),public.platform_owner_payment_billing() to authenticated;
