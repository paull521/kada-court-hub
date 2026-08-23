-- Owner scheduling and score management. Safe to run after 0001 through 0008.

create or replace function public.owner_create_game(
  p_season_id uuid,
  p_home_team_id uuid,
  p_away_team_id uuid,
  p_starts_at timestamp without time zone,
  p_venue text,
  p_court text default null,
  p_home_uniform text default null,
  p_away_uniform text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conference_id uuid;
  v_timezone text;
  v_game_id uuid;
  v_venue text := nullif(trim(p_venue), '');
begin
  select conference_id, conference.timezone
    into v_conference_id, v_timezone
  from public.seasons season
  join public.conferences conference on conference.id = season.conference_id
  where season.id = p_season_id;

  if v_conference_id is null or not public.user_has_conference_role(v_conference_id, array['owner']::public.conference_role[]) then
    raise exception 'Only a conference owner can schedule games.';
  end if;
  if p_home_team_id = p_away_team_id then raise exception 'Choose two different teams.'; end if;
  if v_venue is null or char_length(v_venue) > 120 then raise exception 'Enter a venue of up to 120 characters.'; end if;
  if char_length(coalesce(p_court, '')) > 60 then raise exception 'Enter a shorter court name.'; end if;
  if coalesce(p_home_uniform, '') not in ('', 'White', 'Dark') or coalesce(p_away_uniform, '') not in ('', 'White', 'Dark') then
    raise exception 'Uniform must be White or Dark.';
  end if;
  if not exists (
    select 1 from public.teams team
    join public.divisions division on division.id = team.division_id
    where team.id = p_home_team_id and division.season_id = p_season_id and team.active
  ) or not exists (
    select 1 from public.teams team
    join public.divisions division on division.id = team.division_id
    where team.id = p_away_team_id and division.season_id = p_season_id and team.active
  ) then raise exception 'Both teams must be active teams in this season.'; end if;

  insert into public.games (season_id, home_team_id, away_team_id, starts_at, venue, court, home_uniform, away_uniform)
  values (p_season_id, p_home_team_id, p_away_team_id, p_starts_at at time zone v_timezone, v_venue,
          nullif(trim(p_court), ''), nullif(p_home_uniform, ''), nullif(p_away_uniform, ''))
  returning id into v_game_id;

  insert into public.notifications (profile_id, notification_type, title, body, link_path, entity_id)
  select distinct player.profile_id, 'game_scheduled', 'New game scheduled',
         'A new game was added to your schedule.', '/schedule', v_game_id
  from public.registrations registration
  join public.player_profiles player on player.id = registration.player_id
  where registration.team_id in (p_home_team_id, p_away_team_id)
    and registration.status = 'active' and player.profile_id is not null
  on conflict (profile_id, notification_type, entity_id) do update
    set title = excluded.title, body = excluded.body, link_path = excluded.link_path, read_at = null, created_at = now();

  insert into public.activity_log (conference_id, actor_profile_id, action, entity_type, entity_id, summary)
  values (v_conference_id, (select auth.uid()), 'create', 'game', v_game_id::text, 'Scheduled a game');
  return v_game_id;
end;
$$;

create or replace function public.owner_update_game(
  p_game_id uuid,
  p_starts_at timestamp without time zone,
  p_venue text,
  p_court text default null,
  p_home_uniform text default null,
  p_away_uniform text default null,
  p_home_score integer default null,
  p_away_score integer default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conference_id uuid;
  v_timezone text;
  v_home_team_id uuid;
  v_away_team_id uuid;
  v_venue text := nullif(trim(p_venue), '');
begin
  select season.conference_id, conference.timezone, game.home_team_id, game.away_team_id
    into v_conference_id, v_timezone, v_home_team_id, v_away_team_id
  from public.games game
  join public.seasons season on season.id = game.season_id
  join public.conferences conference on conference.id = season.conference_id
  where game.id = p_game_id;

  if v_conference_id is null or not public.user_has_conference_role(v_conference_id, array['owner']::public.conference_role[]) then
    raise exception 'Only a conference owner can update games.';
  end if;
  if v_venue is null or char_length(v_venue) > 120 then raise exception 'Enter a venue of up to 120 characters.'; end if;
  if char_length(coalesce(p_court, '')) > 60 then raise exception 'Enter a shorter court name.'; end if;
  if coalesce(p_home_uniform, '') not in ('', 'White', 'Dark') or coalesce(p_away_uniform, '') not in ('', 'White', 'Dark') then
    raise exception 'Uniform must be White or Dark.';
  end if;
  if (p_home_score is null) <> (p_away_score is null) then raise exception 'Enter both scores or leave both blank.'; end if;
  if coalesce(p_home_score, 0) < 0 or coalesce(p_away_score, 0) < 0 then raise exception 'Scores cannot be negative.'; end if;

  update public.games
  set starts_at = p_starts_at at time zone v_timezone,
      venue = v_venue,
      court = nullif(trim(p_court), ''),
      home_uniform = nullif(p_home_uniform, ''),
      away_uniform = nullif(p_away_uniform, ''),
      home_score = p_home_score,
      away_score = p_away_score
  where id = p_game_id;

  insert into public.notifications (profile_id, notification_type, title, body, link_path, entity_id)
  select distinct player.profile_id, 'game_updated',
         case when p_home_score is null then 'Game schedule updated' else 'Final score posted' end,
         case when p_home_score is null then 'Review the latest game details.' else 'Your game result is ready.' end,
         '/schedule', p_game_id
  from public.registrations registration
  join public.player_profiles player on player.id = registration.player_id
  where registration.team_id in (v_home_team_id, v_away_team_id)
    and registration.status = 'active' and player.profile_id is not null
  on conflict (profile_id, notification_type, entity_id) do update
    set title = excluded.title, body = excluded.body, link_path = excluded.link_path, read_at = null, created_at = now();

  insert into public.activity_log (conference_id, actor_profile_id, action, entity_type, entity_id, summary)
  values (v_conference_id, (select auth.uid()), 'update', 'game', p_game_id::text,
          case when p_home_score is null then 'Updated a game' else 'Posted a final score' end);
end;
$$;

revoke all on function public.owner_create_game(uuid,uuid,uuid,timestamp without time zone,text,text,text,text) from public;
revoke all on function public.owner_update_game(uuid,timestamp without time zone,text,text,text,text,integer,integer) from public;
grant execute on function public.owner_create_game(uuid,uuid,uuid,timestamp without time zone,text,text,text,text) to authenticated;
grant execute on function public.owner_update_game(uuid,timestamp without time zone,text,text,text,text,integer,integer) to authenticated;
