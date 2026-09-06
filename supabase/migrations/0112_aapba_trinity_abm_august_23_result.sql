-- KCH Pilot - AAPBA test: add the supplied August 23, 2026 D50 League result.
-- Updates only the matching game in this conference, season, and division;
-- otherwise inserts that one finalized game.

do $$
declare
  v_conference_id uuid;
  v_season_id uuid;
  v_division_id uuid;
  v_owner_profile_id uuid;
  v_home_team_id uuid;
  v_away_team_id uuid;
begin
  select conference.id into v_conference_id
  from public.conferences conference
  where conference.name = 'KCH Pilot - AAPBA test'
  order by conference.created_at, conference.id
  limit 1;

  if v_conference_id is null then
    raise exception 'KCH Pilot - AAPBA test was not found.';
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

  select team.id into v_home_team_id
  from public.teams team
  where team.division_id = v_division_id
    and team.name = 'Trinity Travel';

  select team.id into v_away_team_id
  from public.teams team
  where team.division_id = v_division_id
    and team.name = 'ABM Home Care';

  if v_home_team_id is null or v_away_team_id is null then
    raise exception 'AAPBA Trinity Travel or ABM Home Care team was not found.';
  end if;

  update public.games game
  set home_score = case when game.home_team_id = v_home_team_id then 49 else 50 end,
      away_score = case when game.away_team_id = v_away_team_id then 50 else 49 end,
      draft_home_score = null,
      draft_away_score = null,
      score_draft_updated_at = null,
      score_draft_updated_by = null,
      finalized_at = now(),
      finalized_by = v_owner_profile_id
  where game.season_id = v_season_id
    and (game.starts_at at time zone 'America/Los_Angeles')::date = date '2026-08-23'
    and (
      (game.home_team_id = v_home_team_id and game.away_team_id = v_away_team_id)
      or (game.home_team_id = v_away_team_id and game.away_team_id = v_home_team_id)
    );

  insert into public.games(
    season_id, home_team_id, away_team_id, starts_at, venue, court,
    home_uniform, away_uniform, status, phase, duration_minutes,
    home_score, away_score, finalized_at, finalized_by
  )
  select v_season_id, v_home_team_id, v_away_team_id,
    timestamp '2026-08-23 14:30' at time zone 'America/Los_Angeles',
    'Alderwood Boys & Girls Club', 'D50 Court',
    'White', 'Dark', 'scheduled', 'regular', 60,
    49, 50, now(), v_owner_profile_id
  where not exists(
    select 1
    from public.games game
    where game.season_id = v_season_id
      and (game.starts_at at time zone 'America/Los_Angeles')::date = date '2026-08-23'
      and (
        (game.home_team_id = v_home_team_id and game.away_team_id = v_away_team_id)
        or (game.home_team_id = v_away_team_id and game.away_team_id = v_home_team_id)
      )
  );

  insert into public.activity_log(
    conference_id, actor_profile_id, action, entity_type, entity_id, summary
  )
  select v_conference_id, v_owner_profile_id, 'import', 'game_result',
    v_season_id::text, 'Added August 23, 2026 Trinity Travel 49 vs ABM Home Care 50 final result.'
  where not exists(
    select 1
    from public.activity_log log
    where log.conference_id = v_conference_id
      and log.entity_type = 'game_result'
      and log.entity_id = v_season_id::text
      and log.summary = 'Added August 23, 2026 Trinity Travel 49 vs ABM Home Care 50 final result.'
  );
end;
$$;
