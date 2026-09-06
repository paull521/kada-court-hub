-- AAPBA - Pilot Season: add the supplied August 2026 D50 League results.
-- The migration updates a matching game on the same local date when present,
-- otherwise it creates the missing game. It does not touch other conferences.

do $$
declare
  v_conference_id uuid;
  v_season_id uuid;
  v_division_id uuid;
  v_owner_profile_id uuid;
begin
  select conference.id into v_conference_id
  from public.conferences conference
  where conference.name = 'AAPBA - Pilot Season'
  order by conference.created_at, conference.id
  limit 1;

  if v_conference_id is null then
    raise exception 'AAPBA - Pilot Season was not found.';
  end if;

  select season.id into v_season_id
  from public.seasons season
  where season.conference_id = v_conference_id
    and season.name = 'Summer 2026'
  order by season.id
  limit 1;

  if v_season_id is null then
    raise exception 'AAPBA Summer 2026 was not found.';
  end if;

  select division.id into v_division_id
  from public.divisions division
  where division.season_id = v_season_id
    and division.name = 'D50 League'
  order by division.id
  limit 1;

  if v_division_id is null then
    raise exception 'AAPBA D50 League was not found.';
  end if;

  select membership.profile_id into v_owner_profile_id
  from public.conference_memberships membership
  where membership.conference_id = v_conference_id
    and membership.role = 'owner'
  order by membership.created_at, membership.id
  limit 1;

  if v_owner_profile_id is null then
    raise exception 'AAPBA owner profile was not found.';
  end if;

  create temporary table aapba_august_results(
    home_name text,
    away_name text,
    starts_local timestamp,
    home_score integer,
    away_score integer
  ) on commit drop;

  insert into aapba_august_results values
    ('CBA', 'Beautiful Living', '2026-08-19 14:30'::timestamp, 73, 80),
    ('Jess Auto Repair', 'All In', '2026-08-23 14:30'::timestamp, 62, 56),
    ('Elvin House Remodeling', 'Beautiful Living', '2026-08-23 15:30'::timestamp, 60, 54),
    ('J and J Integrity', 'Angeles Care Home', '2026-08-23 16:30'::timestamp, 59, 66),
    ('Kurious Joe', 'CBA', '2026-08-23 17:30'::timestamp, 67, 58);

  -- Finalize any game already present for the same local date and matchup,
  -- including an existing game whose home/away display is reversed.
  update public.games game
  set home_score = case when game.home_team_id = home_team.id then seed.home_score else seed.away_score end,
      away_score = case when game.away_team_id = away_team.id then seed.away_score else seed.home_score end,
      draft_home_score = null,
      draft_away_score = null,
      score_draft_updated_at = null,
      score_draft_updated_by = null,
      finalized_at = now(),
      finalized_by = v_owner_profile_id
  from aapba_august_results seed
  join public.teams home_team
    on home_team.division_id = v_division_id and home_team.name = seed.home_name
  join public.teams away_team
    on away_team.division_id = v_division_id and away_team.name = seed.away_name
  where game.season_id = v_season_id
    and (game.starts_at at time zone 'America/Los_Angeles')::date = seed.starts_local::date
    and (
      (game.home_team_id = home_team.id and game.away_team_id = away_team.id)
      or (game.home_team_id = away_team.id and game.away_team_id = home_team.id)
    );

  insert into public.games(
    season_id, home_team_id, away_team_id, starts_at, venue, court,
    home_uniform, away_uniform, status, phase, duration_minutes,
    home_score, away_score, finalized_at, finalized_by
  )
  select v_season_id, home_team.id, away_team.id,
    seed.starts_local at time zone 'America/Los_Angeles',
    'Alderwood Boys & Girls Club', 'Court 1',
    'White', 'Dark', 'scheduled', 'regular', 60,
    seed.home_score, seed.away_score, now(), v_owner_profile_id
  from aapba_august_results seed
  join public.teams home_team
    on home_team.division_id = v_division_id and home_team.name = seed.home_name
  join public.teams away_team
    on away_team.division_id = v_division_id and away_team.name = seed.away_name
  where not exists(
    select 1
    from public.games game
    where game.season_id = v_season_id
      and (game.starts_at at time zone 'America/Los_Angeles')::date = seed.starts_local::date
      and (
        (game.home_team_id = home_team.id and game.away_team_id = away_team.id)
        or (game.home_team_id = away_team.id and game.away_team_id = home_team.id)
      )
  );

  insert into public.activity_log(
    conference_id, actor_profile_id, action, entity_type, entity_id, summary
  )
  select v_conference_id, v_owner_profile_id, 'import', 'game_results',
    v_season_id::text, 'Added five supplied August 2026 D50 League final results.'
  where not exists(
    select 1 from public.activity_log log
    where log.conference_id = v_conference_id
      and log.entity_type = 'game_results'
      and log.entity_id = v_season_id::text
      and log.summary = 'Added five supplied August 2026 D50 League final results.'
  );
end;
$$;
