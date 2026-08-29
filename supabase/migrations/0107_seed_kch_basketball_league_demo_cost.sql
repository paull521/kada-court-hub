-- Direct paid-demo ledger seed for KCH Basketball League Fall 2026.
-- Div A has 41 assigned players and Div B has 36: $50 + (77 × $3) = $281.
do $$
declare v_conference_id uuid; v_season_id uuid; v_starts_on date; v_players integer;
begin
  select id into v_conference_id from public.conferences where name='KCH Basketball League' order by created_at limit 1;
  if v_conference_id is null then raise exception 'KCH Basketball League was not found.'; end if;

  select id,starts_on into v_season_id,v_starts_on
  from public.seasons
  where conference_id=v_conference_id and canceled_at is null and archived_at is null
  order by starts_on desc,id desc limit 1;
  if v_season_id is null then raise exception 'KCH Basketball League has no available season.'; end if;

  select count(*)::integer into v_players
  from public.registrations
  where season_id=v_season_id and team_id is not null;
  if v_players=0 then raise exception 'KCH Basketball League has no assigned demo players.'; end if;

  update public.conference_subscriptions
  set pilot_season_waived=true,pilot_season_id=null,updated_at=now()
  where conference_id=v_conference_id;

  insert into public.owner_payment_ledger(conference_id,ledger_key,charge_type,label,amount_cents,paid_cents,status,due_on)
  values(v_conference_id,'season-subscription:'||v_season_id,'subscription','Season subscription - Fall 2026',5000,0,'due',v_starts_on)
  on conflict(conference_id,ledger_key) where ledger_key is not null do update
  set label=excluded.label,amount_cents=excluded.amount_cents,due_on=excluded.due_on,
      status=case when owner_payment_ledger.paid_cents>=excluded.amount_cents then 'paid' when owner_payment_ledger.paid_cents>0 then 'partial' else 'due' end,
      updated_at=now();

  insert into public.owner_payment_ledger(conference_id,ledger_key,charge_type,label,amount_cents,paid_cents,status,due_on)
  values(v_conference_id,'player-access:'||v_season_id,'platform_fee','Player access - Fall 2026',v_players*300,0,'due',v_starts_on)
  on conflict(conference_id,ledger_key) where ledger_key is not null do update
  set label=excluded.label,amount_cents=excluded.amount_cents,due_on=excluded.due_on,
      status=case when owner_payment_ledger.paid_cents>=excluded.amount_cents then 'paid' when owner_payment_ledger.paid_cents>0 then 'partial' else 'due' end,
      updated_at=now();
end;
$$;
