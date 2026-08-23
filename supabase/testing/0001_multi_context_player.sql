-- TEST DATA ONLY
-- Gives the first real KCH profile a second player context so the shared
-- conference/division/team switcher can be tested. Safe to run repeatedly.

do $$
declare
  v_profile_id uuid;
  v_player_id uuid;
  v_conference_id uuid;
  v_season_id uuid;
  v_division_id uuid;
  v_team_id uuid;
  v_opponent_id uuid;
  v_registration_id uuid;
begin
  select profile.id
    into v_profile_id
  from public.profiles profile
  join public.player_profiles player on player.profile_id = profile.id
  order by profile.created_at
  limit 1;

  if v_profile_id is null then
    raise exception 'Create a KCH player profile before running this test.';
  end if;

  select id into v_player_id
  from public.player_profiles
  where profile_id = v_profile_id;

  select id into v_conference_id
  from public.conferences
  where slug = 'seattle-filipino-basketball-league';

  if v_conference_id is null then
    raise exception 'Run the first KCH conference setup before this test.';
  end if;

  insert into public.conference_memberships (conference_id, profile_id, role)
  values (v_conference_id, v_profile_id, 'player')
  on conflict (conference_id, profile_id, role) do nothing;

  insert into public.seasons (conference_id, name, starts_on, ends_on, registration_open)
  values (v_conference_id, 'Fall 2026 — Switcher Test', '2026-09-01', '2026-12-15', true)
  on conflict (conference_id, name) do update
    set registration_open = true,
        archived_at = null
  returning id into v_season_id;

  insert into public.divisions (season_id, name)
  values (v_season_id, 'D-League')
  on conflict (season_id, name) do update set name = excluded.name
  returning id into v_division_id;

  insert into public.teams (division_id, name, active)
  values (v_division_id, 'Trinity Travel [TEST]', true)
  on conflict (division_id, name) do update set active = true
  returning id into v_team_id;

  insert into public.teams (division_id, name, active)
  values (v_division_id, 'Kurious Joe [TEST]', true)
  on conflict (division_id, name) do update set active = true
  returning id into v_opponent_id;

  insert into public.registrations
    (player_id, season_id, team_id, status, jersey_number, position, role_label)
  values
    (v_player_id, v_season_id, v_team_id, 'active', 28, 'Forward', 'Player')
  on conflict (player_id, season_id) do update
    set team_id = excluded.team_id,
        status = 'active',
        jersey_number = 28,
        position = 'Forward',
        role_label = 'Player'
  returning id into v_registration_id;

  insert into public.games
    (season_id, home_team_id, away_team_id, starts_at, venue, court, home_uniform, away_uniform)
  select v_season_id, v_team_id, v_opponent_id, '2026-09-13 01:30:00+00',
         'Kada Court Center', 'Court 1', 'Dark', 'White'
  where not exists (
    select 1 from public.games
    where season_id = v_season_id
      and home_team_id = v_team_id
      and away_team_id = v_opponent_id
      and starts_at = '2026-09-13 01:30:00+00'
  );

  insert into public.fees
    (registration_id, category, description, amount_cents, status, due_on)
  select v_registration_id, 'league', 'D-League Test Fee', 2500, 'due', '2026-09-10'
  where not exists (
    select 1 from public.fees
    where registration_id = v_registration_id
      and description = 'D-League Test Fee'
  );
end $$;

select
  player.display_name as player,
  conference.name as conference,
  season.name as season,
  division.name as division,
  team.name as team,
  registration.status
from public.registrations registration
join public.player_profiles player on player.id = registration.player_id
join public.teams team on team.id = registration.team_id
join public.divisions division on division.id = team.division_id
join public.seasons season on season.id = registration.season_id
join public.conferences conference on conference.id = season.conference_id
where player.profile_id = (
  select profile.id
  from public.profiles profile
  join public.player_profiles player_profile on player_profile.profile_id = profile.id
  order by profile.created_at
  limit 1
)
order by season.starts_on;
