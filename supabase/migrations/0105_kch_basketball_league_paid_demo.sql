-- KCH Basketball League is a paid demo, not a free-pilot example.
alter table public.conference_subscriptions
  add column if not exists pilot_season_waived boolean not null default false;

update public.conference_subscriptions subscription
set pilot_season_waived=true,
    pilot_season_id=null,
    updated_at=now()
from public.conferences conference
where conference.id=subscription.conference_id
  and conference.name='KCH Basketball League';

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
  insert into public.conference_subscriptions(conference_id) values(p_conference_id) on conflict(conference_id) do nothing;
  select * into v_subscription from public.conference_subscriptions where conference_id=p_conference_id for update;

  select season.id into v_first_season_id
  from public.seasons season
  where season.conference_id=p_conference_id and season.canceled_at is null
  order by season.starts_on,season.created_at,season.id limit 1;

  if not v_subscription.pilot_season_waived and v_subscription.pilot_season_id is null and v_first_season_id is not null then
    update public.conference_subscriptions set pilot_season_id=v_first_season_id,updated_at=now() where conference_id=p_conference_id;
    v_subscription.pilot_season_id:=v_first_season_id;
  end if;

  for v_season in
    select season.id,season.name,season.starts_on
    from public.seasons season
    where season.conference_id=p_conference_id and season.archived_at is null and season.canceled_at is null
      and season.starts_on<=current_date and season.ends_on>=current_date
    order by season.starts_on,season.name
  loop
    select count(*)::integer into v_players from public.registrations registration
    where registration.season_id=v_season.id and registration.status='active';
    if v_players=0 then continue; end if;
    v_is_pilot:=not v_subscription.pilot_season_waived and v_season.id=v_subscription.pilot_season_id;

    insert into public.owner_payment_ledger(conference_id,ledger_key,charge_type,label,amount_cents,due_on)
    values(p_conference_id,'season-subscription:'||v_season.id,'subscription',
      case when v_is_pilot then 'Pilot season subscription - '||v_season.name else 'Season subscription - '||v_season.name end,
      case when v_is_pilot then 0 else v_subscription.season_amount_cents end,v_season.starts_on)
    on conflict(conference_id,ledger_key) where ledger_key is not null do update
      set amount_cents=excluded.amount_cents,label=excluded.label,due_on=excluded.due_on,updated_at=now()
      where public.owner_payment_ledger.paid_cents=0;

    insert into public.owner_payment_ledger(conference_id,ledger_key,charge_type,label,amount_cents,due_on)
    values(p_conference_id,'player-access:'||v_season.id,'platform_fee',
      case when v_is_pilot then 'Pilot player access - '||v_season.name else 'Player access - '||v_season.name end,
      case when v_is_pilot then 0 else v_players*v_subscription.player_division_amount_cents end,v_season.starts_on)
    on conflict(conference_id,ledger_key) where ledger_key is not null do update
      set amount_cents=excluded.amount_cents,label=excluded.label,due_on=excluded.due_on,updated_at=now()
      where public.owner_payment_ledger.paid_cents=0;
  end loop;
end;
$$;

revoke all on function public.ensure_owner_payment_ledger(uuid) from public;
grant execute on function public.ensure_owner_payment_ledger(uuid) to authenticated;
