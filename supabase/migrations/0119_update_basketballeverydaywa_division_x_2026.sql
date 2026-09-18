-- BasketballeverydayWA / Summer 2026 / Division X 2026 roster and schedule update.
--
-- Source approved by the conference owner:
-- - ten teams and the attached 97-player roster (including the intentionally
--   repeated display name and jersey numbers),
-- - Dan Abalus as SH-Tally Ballers Captain,
-- - the Yahoo-backed Paul Lazarte KCH player as SH-Tally Ballers Co-captain,
-- - every active rostered player paid in full for the $110 league and $50
--   uniform fees, and
-- - the corrected 45-game, nine-games-per-team schedule. On Sep 21, Duterte
--   and OTC are byes: Crocodiles play The Goat and Swishin All Day play Flood
--   Control.
--
-- This migration is deliberately scoped to the exact demo conference. It does
-- not touch other conferences, shared profiles, or scored/finalized games.

do $$
declare
  v_owner_profile_id uuid := '3a244e9a-b8e7-4de8-8926-155934f564af';
  v_owner_player_id uuid;
  v_conference_id uuid;
  v_season_id uuid;
  v_division_id uuid;
  v_roster_count integer;
begin
  select conference.id into v_conference_id
  from public.conferences conference
  where conference.slug = 'basketballeverydaywa';

  if v_conference_id is null then
    raise exception 'BasketballeverydayWA conference was not found.';
  end if;

  select season.id into v_season_id
  from public.seasons season
  where season.conference_id = v_conference_id
    and season.name = 'Summer 2026';

  if v_season_id is null then
    raise exception 'BasketballeverydayWA Summer 2026 season was not found.';
  end if;

  select division.id into v_division_id
  from public.divisions division
  where division.season_id = v_season_id
    and division.name = 'Division X 2026';

  if v_division_id is null then
    raise exception 'BasketballeverydayWA Division X 2026 was not found.';
  end if;

  select player.id into v_owner_player_id
  from public.player_profiles player
  where player.profile_id = v_owner_profile_id;

  if v_owner_player_id is null then
    raise exception 'The approved Paul Lazarte KCH player profile was not found.';
  end if;

  create temporary table bew_roster_update(
    public_id text primary key,
    team_name text not null,
    player_name text not null,
    jersey_number integer not null check (jersey_number between 0 and 99),
    role_label text not null default 'Player'
  ) on commit drop;

  insert into bew_roster_update(public_id, team_name, player_name, jersey_number, role_label) values
    ('BEW-DX-FLD-BEW',             'Flood Control',     'BEW',                    15, 'Player'),
    ('BEW-DX-FLD-GINEZ-JOSH',      'Flood Control',     'Ginez Josh',             30, 'Player'),
    ('BEW-DX-FLD-GINEZ-SELWIN',    'Flood Control',     'Ginez Selwin',           20, 'Player'),
    ('BEW-DX-FLD-JOHNRED',         'Flood Control',     'Johnred',                13, 'Player'),
    ('BEW-DX-FLD-KIT-KEITH-GEOREN','Flood Control',     'KIT Keith Georen',       25, 'Player'),
    ('BEW-DX-FLD-LAPENA-MATT',     'Flood Control',     'Lapena Matt',             5, 'Player'),
    ('BEW-DX-FLD-NATE-NATHAN',     'Flood Control',     'Nate Nathan Enriquez',    2, 'Player'),
    ('BEW-DX-FLD-SV-NOVA',         'Flood Control',     'SV Nova',                10, 'Player'),

    ('BEW-DX-HAP-ASIROT-NELSON',   'Happy Ending',      'Asirot Nelson',          24, 'Player'),
    ('BEW-DX-HAP-ATOY-MERCED',     'Happy Ending',      'Atoy Merced',            23, 'Player'),
    ('BEW-DX-HAP-CORILLA-1',       'Happy Ending',      'Corilla Bong',            3, 'Player'),
    ('BEW-DX-HAP-CORILLA-2',       'Happy Ending',      'Corilla Bong',            3, 'Player'),
    ('BEW-DX-HAP-D-IBIAZ',         'Happy Ending',      'D Ibiaz',                23, 'Player'),
    ('BEW-DX-HAP-KIM',             'Happy Ending',      'Kim',                     5, 'Player'),
    ('BEW-DX-HAP-NEO-JEROME-DAVID','Happy Ending',      'Neo Jerome David',        8, 'Player'),
    ('BEW-DX-HAP-PAGSIBIGAS-AEUS', 'Happy Ending',      'Pagsibigas Aeus',        10, 'Player'),
    ('BEW-DX-HAP-PAUL-DY',         'Happy Ending',      'Paul DY',                12, 'Player'),
    ('BEW-DX-HAP-RENE',            'Happy Ending',      'Rene',                   31, 'Player'),
    ('BEW-DX-HAP-RYKE',            'Happy Ending',      'Ryke',                    7, 'Player'),

    ('BEW-DX-SHT-ALARVA',          'SH-Tally Ballers',  'Alarva',                 13, 'Player'),
    ('BEW-SHT-ALVIN',              'SH-Tally Ballers',  'Alvin',                   5, 'Player'),
    ('BEW-SHT-ARADA',              'SH-Tally Ballers',  'Arada',                  30, 'Player'),
    ('BEW-SHT-DALIT',              'SH-Tally Ballers',  'Dalit',                  14, 'Player'),
    ('BEW-SHT-DAN',                'SH-Tally Ballers',  'Dan Abalus',             36, 'Captain'),
    ('BEW-SHT-DAYTON',             'SH-Tally Ballers',  'Dayton',                 26, 'Player'),
    ('BEW-DX-SHT-DELA-CRUZ',       'SH-Tally Ballers',  'Dela Cruz',              20, 'Player'),
    ('BEW-SHT-DOLOROSO',           'SH-Tally Ballers',  'Doloroso',                1, 'Player'),
    ('BEW-DX-SHT-JALLORINA',       'SH-Tally Ballers',  'Jallorina',              11, 'Player'),
    ('BEW-SHT-SEGOVIA',            'SH-Tally Ballers',  'Segovia',                 7, 'Player'),
    ('BEW-SHT-VINLUAN',            'SH-Tally Ballers',  'Vinluan Steve',           6, 'Player'),
    ('BEW-SHT-WAWA',               'SH-Tally Ballers',  'WAWA',                   28, 'Player'),

    ('BEW-DX-SWA-AGUINALDO-MJ',    'Swishin All Day',   'Aguinaldo MJ',            8, 'Player'),
    ('BEW-DX-SWA-CDC-CRISPO',      'Swishin All Day',   'CDC Crispo',             19, 'Player'),
    ('BEW-DX-SWA-FRANCISCO',       'Swishin All Day',   'Francisco',              13, 'Player'),
    ('BEW-DX-SWA-LAXA-FERNANDO',   'Swishin All Day',   'Laxa Fernando',          64, 'Player'),
    ('BEW-DX-SWA-MERCADO',         'Swishin All Day',   'Mercado',                 1, 'Player'),
    ('BEW-DX-SWA-NAVARRO',         'Swishin All Day',   'Navarro',                25, 'Player'),
    ('BEW-DX-SWA-NELSON-ASIROT',   'Swishin All Day',   'Nelson Asirot',           3, 'Player'),
    ('BEW-DX-SWA-PEREZ-TUGADE',    'Swishin All Day',   'Perez Tugade',            4, 'Player'),
    ('BEW-DX-SWA-SABAS',           'Swishin All Day',   'Sabas',                  20, 'Player'),
    ('BEW-DX-SWA-TUGADE-LEVY',     'Swishin All Day',   'Tugade Levy',            17, 'Player'),

    ('BEW-DX-CRO-ALMARIA-JAY-R',   'Crocodiles',        'Almaria JAY R',          13, 'Player'),
    ('BEW-DX-CRO-AQUINO-REUBEN',   'Crocodiles',        'Aquino Reuben',           2, 'Player'),
    ('BEW-DX-CRO-CJ-CARL-JOHN',    'Crocodiles',        'CJ Carl JOhn',           29, 'Player'),
    ('BEW-DX-CRO-VERNIE-C',        'Crocodiles',        'Croc Vernie C',          16, 'Player'),
    ('BEW-DX-CRO-DALIT',           'Crocodiles',        'Dalit',                   5, 'Player'),
    ('BEW-DX-CRO-JABASA-RON',      'Crocodiles',        'Jabasa Ron',             50, 'Player'),
    ('BEW-DX-CRO-KERNEL-GARCIA',   'Crocodiles',        'Kernel Garcia',          15, 'Player'),
    ('BEW-DX-CRO-PAPA-IDIOS',      'Crocodiles',        'Papa Idios',              8, 'Player'),
    ('BEW-DX-CRO-PUNAY',           'Crocodiles',        'Punay',                  21, 'Player'),

    ('BEW-DX-DUT-BADO',            'Duterte',           'Bado',                   34, 'Player'),
    ('BEW-DX-DUT-BAIT',            'Duterte',           'Bait',                    2, 'Player'),
    ('BEW-DX-DUT-DAVID',           'Duterte',           'David',                   3, 'Player'),
    ('BEW-DX-DUT-JAMEX',           'Duterte',           'Jamex',                   9, 'Player'),
    ('BEW-DX-DUT-MAGAT',           'Duterte',           'Magat',                   6, 'Player'),
    ('BEW-DX-DUT-NJ-NERE',         'Duterte',           'NJ Nere Florentino',     19, 'Player'),
    ('BEW-DX-DUT-PAW',             'Duterte',           'Paw',                    15, 'Player'),
    ('BEW-DX-DUT-YANG',            'Duterte',           'Yang',                   24, 'Player'),

    ('BEW-DX-LAC-LANSANGAN',       'Lacey Hokage',      'Lansangan',              15, 'Player'),
    ('BEW-DX-LAC-LOPEZ',           'Lacey Hokage',      'Lopez',                   5, 'Player'),
    ('BEW-DX-LAC-MACALINO',        'Lacey Hokage',      'Macalino',                5, 'Player'),
    ('BEW-DX-LAC-NETHSKI',         'Lacey Hokage',      'Nethski',                11, 'Player'),
    ('BEW-DX-LAC-NICOLAS',         'Lacey Hokage',      'Nicolas',                16, 'Player'),
    ('BEW-DX-LAC-PAZA',            'Lacey Hokage',      'Paza',                   13, 'Player'),
    ('BEW-DX-LAC-SANTOS',          'Lacey Hokage',      'Santos',                  1, 'Player'),
    ('BEW-DX-LAC-SOLIVEN',         'Lacey Hokage',      'Soliven',                 7, 'Player'),
    ('BEW-DX-LAC-TOLENTINO',       'Lacey Hokage',      'Tolentino',              91, 'Player'),

    ('BEW-DX-OTC-BLANCO',          'OTC',               'Blanco',                 77, 'Player'),
    ('BEW-DX-OTC-DAVIDE',          'OTC',               'Davide',                 18, 'Player'),
    ('BEW-DX-OTC-FERRER',          'OTC',               'Ferrer',                  6, 'Player'),
    ('BEW-DX-OTC-GARCIA-JOSEPH',   'OTC',               'Garcia Joseph',           0, 'Player'),
    ('BEW-DX-OTC-JO-HAKS',         'OTC',               'Jo Haks',                 1, 'Player'),
    ('BEW-DX-OTC-KLEI',            'OTC',               'Klei',                   28, 'Player'),
    ('BEW-DX-OTC-MILOC',           'OTC',               'MILOC',                  20, 'Player'),
    ('BEW-DX-OTC-SIENES',          'OTC',               'Sienes',                  8, 'Player'),
    ('BEW-DX-OTC-VERGARA',         'OTC',               'Vergara',                 7, 'Player'),

    ('BEW-DX-GOA-AP',              'The Goat',          'AP',                     13, 'Player'),
    ('BEW-DX-GOA-CASANOVA-JOHN-V', 'The Goat',          'Casanova John V',        10, 'Player'),
    ('BEW-DX-GOA-CONG-ADRIAN',     'The Goat',          'Cong Adrian',            26, 'Player'),
    ('BEW-DX-GOA-DIOKNO-WESLEY',   'The Goat',          'Diokno Wesley',          25, 'Player'),
    ('BEW-DX-GOA-JDAWG',           'The Goat',          'JDAWG',                   1, 'Player'),
    ('BEW-DX-GOA-NICO-DG-DIZON',   'The Goat',          'Nico DG Dizon',          26, 'Player'),
    ('BEW-DX-GOA-PEREDO-ERHOLL',   'The Goat',          'Peredo Erholl',          22, 'Player'),
    ('BEW-DX-GOA-RJ-RYAN-MANDERA', 'The Goat',          'RJ Ryan Mandera',        12, 'Player'),

    ('BEW-DX-TSH-ANTITIKPNGGAUPO', 'Too Shifty',        'Antitikpnggaupo',        73, 'Player'),
    ('BEW-DX-TSH-CABANTING',       'Too Shifty',        'Cabanting',               7, 'Player'),
    ('BEW-DX-TSH-CANDELARIO',      'Too Shifty',        'Candelario',             15, 'Player'),
    ('BEW-DX-TSH-CORTEZ',          'Too Shifty',        'Cortez',                 14, 'Player'),
    ('BEW-DX-TSH-DING',            'Too Shifty',        'Ding',                   17, 'Player'),
    ('BEW-DX-TSH-FERNANDEZ',       'Too Shifty',        'Fernandez',              10, 'Player'),
    ('BEW-DX-TSH-GALANG',          'Too Shifty',        'Galang',                  5, 'Player'),
    ('BEW-DX-TSH-MAPANAO-PATRICK', 'Too Shifty',        'Mapanao Patrick',         8, 'Player'),
    ('BEW-DX-TSH-RAMOS',           'Too Shifty',        'Ramos',                  34, 'Player'),
    ('BEW-DX-TSH-REYES',           'Too Shifty',        'Reyes',                  11, 'Player'),
    ('BEW-DX-TSH-SISON',           'Too Shifty',        'Sison',                  28, 'Player'),
    ('BEW-DX-TSH-ZAFINN-SHANE',    'Too Shifty',        'ZaFinn Shane Roman',     27, 'Player');

  select count(*) into v_roster_count from bew_roster_update;
  if v_roster_count <> 96 then
    raise exception 'Expected 96 synthetic roster records, found %.', v_roster_count;
  end if;

  -- The supplied roster has thirteen players on SH-Tally Ballers, so retain a
  -- roster limit that accommodates every supplied team.
  update public.seasons
  set starts_on = '2026-09-21',
      ends_on = '2026-12-07',
      players_per_team = 13,
      setup_stage = 7,
      preseason_ready = true
  where id = v_season_id;

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
    updated_by = excluded.updated_by;

  insert into public.teams(division_id, name)
  select v_division_id, team_name
  from (values
    ('Flood Control'), ('Happy Ending'), ('SH-Tally Ballers'),
    ('Swishin All Day'), ('Crocodiles'), ('Duterte'), ('Lacey Hokage'),
    ('OTC'), ('The Goat'), ('Too Shifty')
  ) as seed(team_name)
  on conflict(division_id, name) do update set active = true;

  insert into public.player_profiles(public_player_id, display_name, email, mobile, claimed_at)
  select roster.public_id,
         roster.player_name,
         lower(roster.public_id) || '@example.invalid',
         null,
         null
  from bew_roster_update roster
  on conflict(public_player_id) do update set
    display_name = excluded.display_name,
    email = excluded.email,
    mobile = null;

  insert into public.conference_player_pool(conference_id, player_id, status)
  select v_conference_id, player.id, 'active'
  from public.player_profiles player
  join bew_roster_update roster on roster.public_id = player.public_player_id
  on conflict(conference_id, player_id) do update set
    status = 'active',
    updated_at = now();

  insert into public.conference_player_pool(conference_id, player_id, status)
  values(v_conference_id, v_owner_player_id, 'active')
  on conflict(conference_id, player_id) do update set
    status = 'active',
    updated_at = now();

  -- Preserve any non-demo registrations. Only obsolete BEW synthetic records
  -- are retired when they are absent from the approved roster.
  update public.registrations registration
  set team_id = null,
      status = 'inactive',
      role_label = 'Player'
  from public.player_profiles player
  where registration.player_id = player.id
    and registration.season_id = v_season_id
    and registration.division_id = v_division_id
    and player.public_player_id like 'BEW-%'
    and not exists(
      select 1 from bew_roster_update roster
      where roster.public_id = player.public_player_id
    );

  -- Clear prior SH-Tally Ballers leadership before setting the two approved
  -- leaders below. This affects only this demo team.
  update public.registrations registration
  set role_label = 'Player'
  from public.teams team
  where registration.team_id = team.id
    and registration.season_id = v_season_id
    and registration.division_id = v_division_id
    and team.division_id = v_division_id
    and team.name = 'SH-Tally Ballers'
    and registration.role_label in ('Captain', 'Co-captain');

  insert into public.registrations(
    player_id, season_id, division_id, team_id, status, jersey_number, role_label
  )
  select player.id,
         v_season_id,
         v_division_id,
         team.id,
         'active',
         roster.jersey_number,
         roster.role_label
  from bew_roster_update roster
  join public.player_profiles player on player.public_player_id = roster.public_id
  join public.teams team
    on team.division_id = v_division_id
   and team.name = roster.team_name
  on conflict(player_id, season_id, division_id) where division_id is not null do update set
    team_id = excluded.team_id,
    status = 'active',
    jersey_number = excluded.jersey_number,
    role_label = excluded.role_label;

  insert into public.registrations(
    player_id, season_id, division_id, team_id, status, jersey_number, role_label
  )
  select v_owner_player_id,
         v_season_id,
         v_division_id,
         team.id,
         'active',
         21,
         'Co-captain'
  from public.teams team
  where team.division_id = v_division_id
    and team.name = 'SH-Tally Ballers'
  on conflict(player_id, season_id, division_id) where division_id is not null do update set
    team_id = excluded.team_id,
    status = 'active',
    jersey_number = 21,
    role_label = 'Co-captain';

  insert into public.fees(registration_id, category, description, amount_cents, status, due_on)
  select registration.id,
         'league',
         'Division X 2026 League Fee',
         11000,
         'paid',
         '2026-09-21'
  from public.registrations registration
  where registration.season_id = v_season_id
    and registration.division_id = v_division_id
    and registration.status = 'active'
    and not exists(
      select 1 from public.fees fee
      where fee.registration_id = registration.id
        and fee.category = 'league'
    );

  insert into public.fees(registration_id, category, description, amount_cents, status, due_on)
  select registration.id,
         'uniform',
         'Division X 2026 Uniform Fee',
         5000,
         'paid',
         '2026-09-21'
  from public.registrations registration
  where registration.season_id = v_season_id
    and registration.division_id = v_division_id
    and registration.status = 'active'
    and not exists(
      select 1 from public.fees fee
      where fee.registration_id = registration.id
        and fee.category = 'uniform'
    );

  update public.fees fee
  set description = case fee.category
        when 'league' then 'Division X 2026 League Fee'
        when 'uniform' then 'Division X 2026 Uniform Fee'
      end,
      amount_cents = case fee.category
        when 'league' then 11000
        when 'uniform' then 5000
      end,
      status = 'paid',
      due_on = '2026-09-21'
  from public.registrations registration
  where fee.registration_id = registration.id
    and registration.season_id = v_season_id
    and registration.division_id = v_division_id
    and registration.status = 'active'
    and fee.category in ('league', 'uniform');

  -- Add only the amount not already recorded for each player. Re-running this
  -- migration therefore cannot create a duplicate full-payment entry.
  insert into public.payments(
    registration_id, fee_id, amount_cents, method, recorded_by, paid_at, note
  )
  select registration.id,
         (
           select fee.id
           from public.fees fee
           where fee.registration_id = registration.id
             and fee.category = 'league'
           order by fee.created_at, fee.id
           limit 1
         ),
         fees_due.total_cents - payments_recorded.total_cents,
         'cash',
         v_owner_profile_id,
         now(),
         'BasketballeverydayWA Division X 2026 paid roster import'
  from public.registrations registration
  cross join lateral (
    select coalesce(sum(fee.amount_cents), 0)::integer as total_cents
    from public.fees fee
    where fee.registration_id = registration.id
      and fee.category in ('league', 'uniform')
  ) fees_due
  cross join lateral (
    select coalesce(sum(payment.amount_cents), 0)::integer as total_cents
    from public.payments payment
    where coalesce(
      payment.registration_id,
      (select fee.registration_id from public.fees fee where fee.id = payment.fee_id)
    ) = registration.id
  ) payments_recorded
  where registration.season_id = v_season_id
    and registration.division_id = v_division_id
    and registration.status = 'active'
    and fees_due.total_cents > payments_recorded.total_cents;

  -- Never replace a game that contains a score or finalized result. This demo
  -- migration may replace only the old unscored schedule for this exact season.
  if exists(
    select 1
    from public.games game
    join public.teams home_team on home_team.id = game.home_team_id
    join public.teams away_team on away_team.id = game.away_team_id
    where game.season_id = v_season_id
      and home_team.division_id = v_division_id
      and away_team.division_id = v_division_id
      and (
        game.home_score is not null
        or game.away_score is not null
        or game.finalized_at is not null
      )
  ) then
    raise exception 'BasketballeverydayWA schedule contains scored or finalized games and was not replaced.';
  end if;

  delete from public.games game
  using public.teams home_team, public.teams away_team
  where game.season_id = v_season_id
    and home_team.id = game.home_team_id
    and away_team.id = game.away_team_id
    and home_team.division_id = v_division_id
    and away_team.division_id = v_division_id;

  create temporary table bew_schedule_update(
    home_name text not null,
    away_name text not null,
    starts_local timestamp not null,
    primary key(home_name, away_name, starts_local)
  ) on commit drop;

  insert into bew_schedule_update(home_name, away_name, starts_local) values
    ('SH-Tally Ballers', 'Happy Ending',    '2026-09-21 17:30'),
    ('Crocodiles',       'The Goat',        '2026-09-21 18:30'),
    ('Swishin All Day',  'Flood Control',   '2026-09-21 19:30'),
    ('Too Shifty',       'Lacey Hokage',    '2026-09-21 20:30'),
    ('Too Shifty',       'SH-Tally Ballers','2026-09-28 17:30'),
    ('Happy Ending',     'Lacey Hokage',    '2026-09-28 18:30'),
    ('Duterte',          'The Goat',        '2026-09-28 19:30'),
    ('Swishin All Day',  'OTC',             '2026-09-28 20:30'),
    ('Crocodiles',       'Happy Ending',    '2026-10-05 17:30'),
    ('OTC',              'Flood Control',   '2026-10-05 18:30'),
    ('SH-Tally Ballers', 'Lacey Hokage',    '2026-10-05 19:30'),
    ('Too Shifty',       'Swishin All Day', '2026-10-05 20:30'),
    ('Too Shifty',       'Crocodiles',      '2026-10-12 17:30'),
    ('The Goat',         'OTC',             '2026-10-12 18:30'),
    ('Duterte',          'Lacey Hokage',    '2026-10-12 19:30'),
    ('Swishin All Day',  'SH-Tally Ballers','2026-10-12 20:30'),
    ('Swishin All Day',  'Happy Ending',    '2026-10-19 17:30'),
    ('Crocodiles',       'OTC',             '2026-10-19 18:30'),
    ('Flood Control',    'Lacey Hokage',    '2026-10-19 19:30'),
    ('Too Shifty',       'Duterte',         '2026-10-19 20:30'),
    ('Too Shifty',       'Flood Control',   '2026-10-26 17:30'),
    ('Swishin All Day',  'The Goat',        '2026-10-26 18:30'),
    ('Crocodiles',       'Lacey Hokage',    '2026-10-26 19:30'),
    ('SH-Tally Ballers', 'Duterte',         '2026-10-26 20:30'),
    ('Happy Ending',     'The Goat',        '2026-11-02 17:30'),
    ('SH-Tally Ballers', 'Crocodiles',      '2026-11-02 18:30'),
    ('OTC',              'Lacey Hokage',    '2026-11-02 19:30'),
    ('Duterte',          'Flood Control',   '2026-11-02 20:30'),
    ('Too Shifty',       'Happy Ending',    '2026-11-09 17:30'),
    ('The Goat',         'Flood Control',   '2026-11-09 18:30'),
    ('Crocodiles',       'Duterte',         '2026-11-09 19:30'),
    ('Swishin All Day',  'Lacey Hokage',    '2026-11-09 20:30'),
    ('Happy Ending',     'OTC',             '2026-11-16 17:30'),
    ('SH-Tally Ballers', 'Flood Control',   '2026-11-16 18:30'),
    ('The Goat',         'Lacey Hokage',    '2026-11-16 19:30'),
    ('Swishin All Day',  'Duterte',         '2026-11-16 20:30'),
    ('Too Shifty',       'OTC',             '2026-11-23 17:30'),
    ('Crocodiles',       'Flood Control',   '2026-11-23 18:30'),
    ('SH-Tally Ballers', 'The Goat',        '2026-11-23 19:30'),
    ('Happy Ending',     'Duterte',         '2026-11-23 20:30'),
    ('Happy Ending',     'Flood Control',   '2026-11-30 17:30'),
    ('Too Shifty',       'The Goat',        '2026-11-30 18:30'),
    ('Duterte',          'OTC',             '2026-11-30 19:30'),
    ('Swishin All Day',  'Crocodiles',      '2026-11-30 20:30'),
    ('SH-Tally Ballers', 'OTC',             '2026-12-07 17:30');

  if (select count(*) from bew_schedule_update) <> 45 then
    raise exception 'Expected 45 Division X 2026 games.';
  end if;

  if exists(
    select 1
    from bew_schedule_update schedule
    left join public.teams home_team
      on home_team.division_id = v_division_id
     and home_team.name = schedule.home_name
    left join public.teams away_team
      on away_team.division_id = v_division_id
     and away_team.name = schedule.away_name
    where home_team.id is null or away_team.id is null
  ) then
    raise exception 'A supplied BasketballeverydayWA schedule team was not found.';
  end if;

  insert into public.games(
    season_id, home_team_id, away_team_id, starts_at, venue, court,
    home_uniform, away_uniform, status, phase, duration_minutes
  )
  select v_season_id,
         home_team.id,
         away_team.id,
         schedule.starts_local at time zone 'America/Los_Angeles',
         'Fieldhouse',
         'Court 3',
         'White',
         'Dark',
         'scheduled',
         'regular',
         60
  from bew_schedule_update schedule
  join public.teams home_team
    on home_team.division_id = v_division_id
   and home_team.name = schedule.home_name
  join public.teams away_team
    on away_team.division_id = v_division_id
   and away_team.name = schedule.away_name;

  insert into public.division_schedule_workflows(
    division_id, mode, status, finalized_at, updated_by
  )
  values(v_division_id, 'manual', 'final', now(), v_owner_profile_id)
  on conflict(division_id) do update set
    mode = 'manual',
    status = 'final',
    finalized_at = now(),
    updated_at = now(),
    updated_by = excluded.updated_by;

  insert into public.activity_log(
    conference_id, actor_profile_id, action, entity_type, entity_id, summary
  )
  select v_conference_id,
         v_owner_profile_id,
         'update',
         'division_roster_schedule',
         v_division_id::text,
         'Updated Division X 2026 to the approved ten-team roster, paid balances, and 45-game schedule.'
  where not exists(
    select 1
    from public.activity_log log
    where log.conference_id = v_conference_id
      and log.entity_type = 'division_roster_schedule'
      and log.entity_id = v_division_id::text
      and log.summary = 'Updated Division X 2026 to the approved ten-team roster, paid balances, and 45-game schedule.'
  );
end;
$$;
