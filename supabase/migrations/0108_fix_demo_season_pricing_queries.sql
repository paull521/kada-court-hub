-- The seasons table has no created_at column. Repair the paid-demo helpers.
create or replace function public.ensure_owner_payment_ledger(p_conference_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_subscription public.conference_subscriptions%rowtype; v_season record; v_players integer; v_first_season_id uuid; v_demo_season_id uuid; v_is_demo boolean; v_is_pilot boolean;
begin
  if not (public.is_platform_creator() or public.user_has_conference_role(p_conference_id,array['owner']::public.conference_role[])) then raise exception 'Owner or Platform Creator access is required.'; end if;
  insert into public.conference_subscriptions(conference_id) values(p_conference_id) on conflict(conference_id) do nothing;
  select * into v_subscription from public.conference_subscriptions where conference_id=p_conference_id for update;
  select conference.name='KCH Basketball League' into v_is_demo from public.conferences conference where conference.id=p_conference_id;
  select season.id into v_first_season_id from public.seasons season where season.conference_id=p_conference_id and season.canceled_at is null order by season.starts_on,season.id limit 1;
  if not v_subscription.pilot_season_waived and v_subscription.pilot_season_id is null and v_first_season_id is not null then update public.conference_subscriptions set pilot_season_id=v_first_season_id,updated_at=now() where conference_id=p_conference_id; v_subscription.pilot_season_id:=v_first_season_id; end if;
  if v_is_demo then select season.id into v_demo_season_id from public.seasons season where season.conference_id=p_conference_id and season.canceled_at is null order by season.starts_on desc,season.id desc limit 1; end if;
  for v_season in select season.id,season.name,season.starts_on from public.seasons season where season.conference_id=p_conference_id and season.archived_at is null and season.canceled_at is null and ((season.starts_on<=current_date and season.ends_on>=current_date) or (v_is_demo and season.id=v_demo_season_id)) order by season.starts_on,season.name loop
    select count(*)::integer into v_players from public.registrations registration where registration.season_id=v_season.id and (registration.status='active' or (v_is_demo and registration.team_id is not null));
    if v_players=0 then continue; end if;
    v_is_pilot:=not v_subscription.pilot_season_waived and v_season.id=v_subscription.pilot_season_id;
    insert into public.owner_payment_ledger(conference_id,ledger_key,charge_type,label,amount_cents,due_on) values(p_conference_id,'season-subscription:'||v_season.id,'subscription',case when v_is_pilot then 'Pilot season subscription - '||v_season.name else 'Season subscription - '||v_season.name end,case when v_is_pilot then 0 else v_subscription.season_amount_cents end,v_season.starts_on) on conflict(conference_id,ledger_key) where ledger_key is not null do update set amount_cents=excluded.amount_cents,label=excluded.label,due_on=excluded.due_on,updated_at=now() where public.owner_payment_ledger.paid_cents=0;
    insert into public.owner_payment_ledger(conference_id,ledger_key,charge_type,label,amount_cents,due_on) values(p_conference_id,'player-access:'||v_season.id,'platform_fee',case when v_is_pilot then 'Pilot player access - '||v_season.name else 'Player access - '||v_season.name end,case when v_is_pilot then 0 else v_players*v_subscription.player_division_amount_cents end,v_season.starts_on) on conflict(conference_id,ledger_key) where ledger_key is not null do update set amount_cents=excluded.amount_cents,label=excluded.label,due_on=excluded.due_on,updated_at=now() where public.owner_payment_ledger.paid_cents=0;
  end loop;
end;
$$;

create or replace function public.owner_payment_billing(p_conference_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_entries jsonb; v_submissions jsonb; v_divisions jsonb; v_pilot_season_id uuid; v_demo_season_id uuid; v_is_demo boolean;
begin
  if not public.user_has_conference_role(p_conference_id,array['owner']::public.conference_role[]) then raise exception 'Owner access is required.'; end if;
  perform public.ensure_owner_payment_ledger(p_conference_id);
  select subscription.pilot_season_id,conference.name='KCH Basketball League' into v_pilot_season_id,v_is_demo from public.conference_subscriptions subscription join public.conferences conference on conference.id=subscription.conference_id where subscription.conference_id=p_conference_id;
  if v_is_demo then select id into v_demo_season_id from public.seasons where conference_id=p_conference_id and canceled_at is null order by starts_on desc,id desc limit 1; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',entry.id,'chargeType',entry.charge_type,'label',entry.label,'amountCents',entry.amount_cents,'paidCents',entry.paid_cents,'balanceCents',entry.amount_cents-entry.paid_cents,'status',entry.status,'dueOn',entry.due_on) order by entry.due_on nulls last,entry.created_at),'[]'::jsonb) into v_entries from public.owner_payment_ledger entry where entry.conference_id=p_conference_id;
  select coalesce(jsonb_agg(jsonb_build_object('id',submission.id,'amountCents',submission.amount_cents,'method',submission.method,'status',submission.status,'submittedAt',submission.submitted_at,'reviewedAt',submission.reviewed_at) order by submission.submitted_at desc),'[]'::jsonb) into v_submissions from public.conference_subscription_payment_submissions submission where submission.conference_id=p_conference_id;
  select coalesce(jsonb_agg(jsonb_build_object('divisionName',division.name,'activePlayers',counts.players,'platformFeeCents',case when season.id=v_pilot_season_id then 0 else counts.players*300 end) order by season.starts_on,division.name),'[]'::jsonb) into v_divisions from public.divisions division join public.seasons season on season.id=division.season_id left join lateral(select count(*)::integer as players from public.registrations registration where registration.division_id=division.id and (registration.status='active' or (v_is_demo and registration.team_id is not null))) counts on true where season.conference_id=p_conference_id and season.archived_at is null and season.canceled_at is null and ((season.starts_on<=current_date and season.ends_on>=current_date) or (v_is_demo and season.id=v_demo_season_id));
  return jsonb_build_object('entries',v_entries,'submissions',v_submissions,'divisions',v_divisions);
end;
$$;

revoke all on function public.ensure_owner_payment_ledger(uuid),public.owner_payment_billing(uuid) from public;
grant execute on function public.ensure_owner_payment_ledger(uuid),public.owner_payment_billing(uuid) to authenticated;
