-- Update only the approved WAPinoy Sep 18 schedule. Sep 11 final games are
-- deliberately left unchanged. Truth and United Airballers are not created or
-- scheduled because they are unavailable in the WAPinoy conference.

do $$
declare
  v_conference_id uuid;
  v_season_id uuid;
  v_owner_profile_id uuid;
begin
  select conference.id, season.id, owner_record.profile_id
    into v_conference_id, v_season_id, v_owner_profile_id
  from public.conferences conference
  join public.seasons season on season.conference_id = conference.id
  left join public.platform_owner_records owner_record on owner_record.conference_id = conference.id
  where conference.slug = 'wapinoy'
    and season.name = 'Cardio Friday Season IV';

  if v_season_id is null then
    raise exception 'WAPinoy Cardio Friday Season IV was not found.';
  end if;

  create temporary table wapinoy_sep_18_schedule(
    home_name text not null,
    away_name text not null,
    starts_local timestamp not null,
    court text not null,
    primary key(home_name, away_name, starts_local)
  ) on commit drop;

  insert into wapinoy_sep_18_schedule(home_name, away_name, starts_local, court) values
    ('James',             'Remy Boyz',          '2026-09-18 18:00', 'Max - Main Gym 1'),
    ('Gameface Vizual',   'RJ12',               '2026-09-18 19:00', 'Max - Main Gym 1'),
    ('Magenta Ballers',   'Andrei North',       '2026-09-18 20:00', 'Max - Main Gym 1'),
    ('Lawpacs',           'Tonton',             '2026-09-18 18:00', 'Joan - Main Gym 2'),
    ('Boss Amo',          'Mike F',             '2026-09-18 19:00', 'Joan - Main Gym 2'),
    ('Messiah',           'Adept Junk Removal', '2026-09-18 20:00', 'Joan - Main Gym 2'),
    ('Trinity Travel',    'Basketball Everyday','2026-09-18 20:00', 'Lawrence - East Gym');

  if exists(
    select 1
    from wapinoy_sep_18_schedule schedule
    left join public.teams home_team
      on home_team.name = schedule.home_name
     and home_team.division_id in (
       select division.id from public.divisions division where division.season_id = v_season_id
     )
    left join public.teams away_team
      on away_team.name = schedule.away_name
     and away_team.division_id in (
       select division.id from public.divisions division where division.season_id = v_season_id
     )
    where home_team.id is null or away_team.id is null
  ) then
    raise exception 'A supplied WAPinoy Sep 18 team was not found.';
  end if;

  if exists(
    select 1
    from wapinoy_sep_18_schedule first_game
    join wapinoy_sep_18_schedule second_game
      on first_game.ctid < second_game.ctid
     and first_game.starts_local = second_game.starts_local
     and (
       first_game.court = second_game.court
       or first_game.home_name in (second_game.home_name, second_game.away_name)
       or first_game.away_name in (second_game.home_name, second_game.away_name)
     )
  ) then
    raise exception 'The supplied WAPinoy Sep 18 schedule has a duplicate court or team time.';
  end if;

  -- Replace only the unscored 40 Over games that this flyer supersedes.
  if exists(
    select 1
    from public.games game
    join public.teams home_team on home_team.id = game.home_team_id
    join public.teams away_team on away_team.id = game.away_team_id
    where game.season_id = v_season_id
      and (game.starts_at at time zone 'America/Los_Angeles')::date = '2026-09-18'
      and (
        (home_team.name = 'Gameface Vizual' and away_team.name = 'RJ12')
        or (home_team.name = 'Andrei North' and away_team.name = 'Magenta Ballers')
        or (home_team.name = 'Basketball Everyday' and away_team.name = 'Trinity Travel')
      )
      and (game.home_score is not null or game.away_score is not null or game.finalized_at is not null)
  ) then
    raise exception 'A Sep 18 game to be replaced contains a score or finalized result.';
  end if;

  delete from public.games game
  using public.teams home_team, public.teams away_team
  where game.home_team_id = home_team.id
    and game.away_team_id = away_team.id
    and game.season_id = v_season_id
    and (game.starts_at at time zone 'America/Los_Angeles')::date = '2026-09-18'
    and (
      (home_team.name = 'Gameface Vizual' and away_team.name = 'RJ12')
      or (home_team.name = 'Andrei North' and away_team.name = 'Magenta Ballers')
      or (home_team.name = 'Basketball Everyday' and away_team.name = 'Trinity Travel')
    );

  insert into public.games(
    season_id, home_team_id, away_team_id, starts_at, venue, court,
    home_uniform, away_uniform, status, phase, duration_minutes
  )
  select v_season_id,
         home_team.id,
         away_team.id,
         schedule.starts_local at time zone 'America/Los_Angeles',
         'Kentridge High School',
         schedule.court,
         'White',
         'Dark',
         'scheduled',
         'regular',
         60
  from wapinoy_sep_18_schedule schedule
  join public.teams home_team
    on home_team.name = schedule.home_name
   and home_team.division_id in (
     select division.id from public.divisions division where division.season_id = v_season_id
   )
  join public.teams away_team
    on away_team.name = schedule.away_name
   and away_team.division_id in (
     select division.id from public.divisions division where division.season_id = v_season_id
   )
  where not exists(
    select 1
    from public.games game
    where game.season_id = v_season_id
      and game.home_team_id = home_team.id
      and game.away_team_id = away_team.id
      and game.starts_at = schedule.starts_local at time zone 'America/Los_Angeles'
  );

  if v_owner_profile_id is not null then
    insert into public.activity_log(
      conference_id, actor_profile_id, action, entity_type, entity_id, summary
    )
    select v_conference_id,
           v_owner_profile_id,
           'update',
           'schedule',
           v_season_id::text,
           'Updated the approved Sep 18 WAPinoy schedule; Sep 11 final games were left unchanged.'
    where not exists(
      select 1
      from public.activity_log log
      where log.conference_id = v_conference_id
        and log.entity_type = 'schedule'
        and log.entity_id = v_season_id::text
        and log.summary = 'Updated the approved Sep 18 WAPinoy schedule; Sep 11 final games were left unchanged.'
    );
  end if;
end;
$$;
