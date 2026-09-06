-- BasketballeverydayWA demo: Paul Lazarte (the Yahoo-backed KCH profile)
-- owns, captains, and plays for SH-Tally Ballers. All other roster entries
-- are conference-scoped demo players with non-deliverable contact details.
--
-- This migration writes only the BasketballeverydayWA conference and its
-- dependent records. It is safe to rerun: inserts use natural uniqueness
-- checks and never delete or reset existing KCH data.

do $$
declare
  v_owner_profile_id uuid := '3a244e9a-b8e7-4de8-8926-155934f564af';
  v_owner_player_id uuid;
  v_owner_name text;
  v_owner_email text;
  v_owner_phone text;
  v_conference_id uuid;
  v_season_id uuid;
  v_division_id uuid;
begin
  select profile.display_name, coalesce(profile.mobile, '')
    into v_owner_name, v_owner_phone
  from public.profiles profile
  where profile.id = v_owner_profile_id;

  if v_owner_name is null then
    raise exception 'The selected Paul Lazarte KCH profile was not found.';
  end if;

  select player.id into v_owner_player_id
  from public.player_profiles player
  where player.profile_id = v_owner_profile_id;

  if v_owner_player_id is null then
    insert into public.player_profiles(profile_id, public_player_id, display_name, claimed_at)
    values(
      v_owner_profile_id,
      'KCH-' || upper(substr(replace(v_owner_profile_id::text, '-', ''), 1, 8)),
      v_owner_name,
      now()
    )
    returning id into v_owner_player_id;
  end if;

  select record.email into v_owner_email
  from public.platform_owner_records record
  where record.profile_id = v_owner_profile_id
  order by record.created_at
  limit 1;
  v_owner_email := coalesce(v_owner_email, lower(v_owner_profile_id::text) || '@kch.local');

  insert into public.conferences(name, slug, timezone, is_test)
  values('BasketballeverydayWA', 'basketballeverydaywa', 'America/Los_Angeles', false)
  on conflict(slug) do update set
    name = excluded.name,
    timezone = excluded.timezone,
    is_test = false
  returning id into v_conference_id;

  insert into public.conference_memberships(conference_id, profile_id, role)
  values
    (v_conference_id, v_owner_profile_id, 'owner'),
    (v_conference_id, v_owner_profile_id, 'player')
  on conflict do nothing;

  insert into public.platform_owner_records(
    conference_id, profile_id, full_name, email, phone, status, subscription_starts_on
  )
  values(
    v_conference_id, v_owner_profile_id, v_owner_name, v_owner_email, v_owner_phone, 'active', '2026-09-14'
  )
  on conflict(conference_id) do update set
    profile_id = excluded.profile_id,
    full_name = excluded.full_name,
    email = excluded.email,
    phone = excluded.phone,
    status = 'active',
    updated_at = now();

  -- The first season remains a complimentary pilot under the existing KCH
  -- owner-pricing rules; no owner subscription charge is inserted here.
  insert into public.conference_subscriptions(conference_id)
  values(v_conference_id)
  on conflict(conference_id) do nothing;

  insert into public.seasons(
    conference_id, name, starts_on, ends_on, registration_open,
    setup_stage, preseason_ready, players_per_team
  )
  values(
    v_conference_id, 'Summer 2026', '2026-09-14', '2026-11-16', false,
    7, true, 10
  )
  on conflict(conference_id, name) do update set
    starts_on = excluded.starts_on,
    ends_on = excluded.ends_on,
    registration_open = false,
    setup_stage = 7,
    preseason_ready = true,
    players_per_team = 10
  returning id into v_season_id;

  insert into public.divisions(season_id, name)
  values(v_season_id, 'Division X 2026')
  on conflict(season_id, name) do nothing;

  select id into v_division_id
  from public.divisions
  where season_id = v_season_id and name = 'Division X 2026';

  insert into public.teams(division_id, name)
  select v_division_id, seed.team_name
  from unnest(array[
    'Too Shifty', 'Swishin All Day', 'SH-Tally Ballers', 'Crocodiles',
    'Happy Ending', 'Duterte', 'The Goat', 'OTC', 'Lacey Hokage'
  ]) as seed(team_name)
  on conflict(division_id, name) do update set active = true;

  insert into public.division_financial_settings(
    division_id, league_fee_enabled, league_fee_cents,
    uniform_fee_enabled, uniform_fee_cents, platform_fee_cents, updated_by
  )
  values(v_division_id, true, 11000, true, 5000, 0, v_owner_profile_id)
  on conflict(division_id) do update set
    league_fee_enabled = true,
    league_fee_cents = 11000,
    uniform_fee_enabled = true,
    uniform_fee_cents = 5000,
    platform_fee_cents = 0,
    updated_at = now(),
    updated_by = v_owner_profile_id;

  insert into public.player_profiles(
    public_player_id, display_name, email, mobile, preferred_uniform_size
  )
  select public_id, player_name, email, mobile, uniform_size
  from (values
    ('BEW-SHT-DAN',      'Dan',      'dan.bew@example.invalid',      '+1 206-555-2101', 'L'),
    ('BEW-SHT-SEGOVIA',  'Segovia',  'segovia.bew@example.invalid',  '+1 206-555-2102', 'M'),
    ('BEW-SHT-ALVIN',    'Alvin',    'alvin.bew@example.invalid',    '+1 206-555-2103', 'Top Large / Short Medium'),
    ('BEW-SHT-DALIT',    'Dalit',    'dalit.bew@example.invalid',    '+1 206-555-2104', 'L'),
    ('BEW-SHT-VINLUAN',  'Vinluan',  'vinluan.bew@example.invalid',  '+1 206-555-2105', 'L'),
    ('BEW-SHT-DAYTON',   'Dayton',   'dayton.bew@example.invalid',   '+1 206-555-2106', 'Top Large / Short Medium'),
    ('BEW-SHT-WAWA',     'Wawa',     'wawa.bew@example.invalid',     '+1 206-555-2107', 'Top Large / Short Medium'),
    ('BEW-SHT-ARADA',    'Arada',    'arada.bew@example.invalid',    '+1 206-555-2108', 'Top 2XL / Short M'),
    ('BEW-SHT-DOLOROSO', 'Doloroso', 'doloroso.bew@example.invalid', '+1 206-555-2109', 'L')
  ) as seed(public_id, player_name, email, mobile, uniform_size)
  on conflict(public_player_id) do update set
    display_name = excluded.display_name,
    email = excluded.email,
    mobile = excluded.mobile,
    preferred_uniform_size = excluded.preferred_uniform_size;

  insert into public.conference_player_pool(conference_id, player_id, status)
  select v_conference_id, player.id, 'active'
  from public.player_profiles player
  where player.id = v_owner_player_id
     or player.public_player_id in (
       'BEW-SHT-DAN', 'BEW-SHT-SEGOVIA', 'BEW-SHT-ALVIN', 'BEW-SHT-DALIT',
       'BEW-SHT-VINLUAN', 'BEW-SHT-DAYTON', 'BEW-SHT-WAWA', 'BEW-SHT-ARADA',
       'BEW-SHT-DOLOROSO'
     )
  on conflict(conference_id, player_id) do update set
    status = 'active',
    updated_at = now();

  insert into public.registrations(
    player_id, season_id, division_id, team_id, status, jersey_number, role_label
  )
  select player.id, v_season_id, v_division_id, team.id, 'active', seed.jersey_number, 'Player'
  from (values
    ('BEW-SHT-DAN', 36), ('BEW-SHT-SEGOVIA', 7), ('BEW-SHT-ALVIN', 5),
    ('BEW-SHT-DALIT', 14), ('BEW-SHT-VINLUAN', 6), ('BEW-SHT-DAYTON', 26),
    ('BEW-SHT-WAWA', 28), ('BEW-SHT-ARADA', 30), ('BEW-SHT-DOLOROSO', 1)
  ) as seed(public_id, jersey_number)
  join public.player_profiles player on player.public_player_id = seed.public_id
  join public.teams team on team.division_id = v_division_id and team.name = 'SH-Tally Ballers'
  on conflict(player_id, season_id, division_id) where division_id is not null do update set
    team_id = excluded.team_id,
    status = 'active',
    jersey_number = excluded.jersey_number,
    role_label = 'Player';

  insert into public.registrations(
    player_id, season_id, division_id, team_id, status, jersey_number, role_label
  )
  select v_owner_player_id, v_season_id, v_division_id, team.id, 'active', 21, 'Captain'
  from public.teams team
  where team.division_id = v_division_id and team.name = 'SH-Tally Ballers'
  on conflict(player_id, season_id, division_id) where division_id is not null do update set
    team_id = excluded.team_id,
    status = 'active',
    jersey_number = 21,
    role_label = 'Captain';

  insert into public.fees(registration_id, category, description, amount_cents, status, due_on)
  select registration.id, 'league', 'Division X 2026 League Fee', 11000, 'due', '2026-09-14'
  from public.registrations registration
  where registration.season_id = v_season_id
    and registration.division_id = v_division_id
    and not exists(
      select 1 from public.fees fee
      where fee.registration_id = registration.id and fee.category = 'league'
    );

  insert into public.fees(registration_id, category, description, amount_cents, status, due_on)
  select registration.id, 'uniform', 'Division X 2026 Uniform Fee', 5000, 'paid', '2026-09-14'
  from public.registrations registration
  where registration.season_id = v_season_id
    and registration.division_id = v_division_id
    and not exists(
      select 1 from public.fees fee
      where fee.registration_id = registration.id and fee.category = 'uniform'
    );

  insert into public.payments(registration_id, fee_id, amount_cents, method, recorded_by, paid_at, note)
  select registration.id, fee.id, 5000, 'cash', v_owner_profile_id,
    '2026-09-01 12:00:00-07', 'BasketballeverydayWA demo uniform payment'
  from public.registrations registration
  join public.fees fee on fee.registration_id = registration.id and fee.category = 'uniform'
  where registration.season_id = v_season_id
    and registration.division_id = v_division_id
    and not exists(
      select 1 from public.payments payment
      where payment.registration_id = registration.id
        and payment.note = 'BasketballeverydayWA demo uniform payment'
    );

  insert into public.games(
    season_id, home_team_id, away_team_id, starts_at, venue, court,
    home_uniform, away_uniform, status, phase, duration_minutes
  )
  select v_season_id, home_team.id, away_team.id,
    seed.starts_local at time zone 'America/Los_Angeles', 'Fieldhouse', 'Court 3',
    'White', 'Dark', 'scheduled', 'regular', 60
  from (values
    -- Preseason
    ('SH-Tally Ballers', 'Too Shifty',      '2026-09-14 17:30'::timestamp),
    -- Week 1
    ('Too Shifty',       'Crocodiles',      '2026-09-21 17:30'::timestamp),
    ('SH-Tally Ballers', 'OTC',              '2026-09-21 18:30'::timestamp),
    ('Swishin All Day',  'Lacey Hokage',     '2026-09-21 19:30'::timestamp),
    ('Happy Ending',     'Duterte',          '2026-09-21 20:30'::timestamp),
    -- Week 2
    ('The Goat',         'Swishin All Day',  '2026-09-28 17:30'::timestamp),
    ('Crocodiles',       'Happy Ending',     '2026-09-28 18:30'::timestamp),
    ('Too Shifty',       'Lacey Hokage',     '2026-09-28 19:30'::timestamp),
    ('SH-Tally Ballers', 'Duterte',          '2026-09-28 20:30'::timestamp),
    -- Week 3
    ('SH-Tally Ballers', 'Crocodiles',       '2026-10-05 17:30'::timestamp),
    ('Swishin All Day',  'Happy Ending',     '2026-10-05 18:30'::timestamp),
    ('Too Shifty',       'OTC',              '2026-10-05 19:30'::timestamp),
    ('Lacey Hokage',     'The Goat',         '2026-10-05 20:30'::timestamp),
    -- Week 4
    ('Too Shifty',       'The Goat',         '2026-10-12 17:30'::timestamp),
    ('Swishin All Day',  'SH-Tally Ballers', '2026-10-12 18:30'::timestamp),
    ('Lacey Hokage',     'Happy Ending',     '2026-10-12 19:30'::timestamp),
    ('OTC',              'Duterte',          '2026-10-12 20:30'::timestamp),
    -- Week 5
    ('The Goat',         'Happy Ending',     '2026-10-19 17:30'::timestamp),
    ('OTC',              'Crocodiles',       '2026-10-19 18:30'::timestamp),
    ('Lacey Hokage',     'SH-Tally Ballers', '2026-10-19 19:30'::timestamp),
    ('Too Shifty',       'Duterte',          '2026-10-19 20:30'::timestamp),
    -- Week 6
    ('The Goat',         'SH-Tally Ballers', '2026-10-26 17:30'::timestamp),
    ('Too Shifty',       'Happy Ending',     '2026-10-26 18:30'::timestamp),
    ('OTC',              'Swishin All Day',  '2026-10-26 19:30'::timestamp),
    ('Duterte',          'Crocodiles',       '2026-10-26 20:30'::timestamp),
    -- Week 7
    ('Too Shifty',       'Crocodiles',       '2026-11-02 17:30'::timestamp),
    ('Happy Ending',     'SH-Tally Ballers', '2026-11-02 18:30'::timestamp),
    ('OTC',              'Lacey Hokage',     '2026-11-02 19:30'::timestamp),
    ('Duterte',          'Swishin All Day',  '2026-11-02 20:30'::timestamp),
    -- Week 8
    ('OTC',              'Too Shifty',       '2026-11-09 17:30'::timestamp),
    ('Happy Ending',     'SH-Tally Ballers', '2026-11-09 18:30'::timestamp),
    ('Crocodiles',       'Swishin All Day',  '2026-11-09 19:30'::timestamp),
    ('Duterte',          'Lacey Hokage',     '2026-11-09 20:30'::timestamp),
    -- Week 9
    ('Happy Ending',     'OTC',              '2026-11-16 17:30'::timestamp),
    ('Too Shifty',       'Swishin All Day',  '2026-11-16 18:30'::timestamp),
    ('Crocodiles',       'Lacey Hokage',     '2026-11-16 19:30'::timestamp),
    ('Duterte',          'The Goat',         '2026-11-16 20:30'::timestamp)
  ) as seed(home_name, away_name, starts_local)
  join public.teams home_team
    on home_team.division_id = v_division_id and home_team.name = seed.home_name
  join public.teams away_team
    on away_team.division_id = v_division_id and away_team.name = seed.away_name
  where not exists(
    select 1 from public.games game
    where game.season_id = v_season_id
      and game.home_team_id = home_team.id
      and game.away_team_id = away_team.id
      and game.starts_at = seed.starts_local at time zone 'America/Los_Angeles'
  );

  insert into public.division_schedule_workflows(
    division_id, mode, status, finalized_at, updated_by
  )
  values(v_division_id, 'manual', 'final', now(), v_owner_profile_id)
  on conflict(division_id) do update set
    mode = 'manual',
    status = 'final',
    finalized_at = coalesce(division_schedule_workflows.finalized_at, now()),
    updated_at = now(),
    updated_by = excluded.updated_by;

  insert into public.activity_log(
    conference_id, actor_profile_id, action, entity_type, entity_id, summary
  )
  select v_conference_id, v_owner_profile_id, 'create', 'conference_demo',
    v_conference_id::text, 'Created BasketballeverydayWA demo conference and SH-Tally Ballers roster.'
  where not exists(
    select 1 from public.activity_log log
    where log.conference_id = v_conference_id
      and log.entity_type = 'conference_demo'
      and log.entity_id = v_conference_id::text
  );
end;
$$;
