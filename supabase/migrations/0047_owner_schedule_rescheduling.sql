-- A rescheduled game replaces the original time and stays visible in the player schedule.
create or replace function public.owner_reschedule_game(
  p_game_id uuid,
  p_starts_at timestamp without time zone,
  p_venue text,
  p_court text default null,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conference_id uuid;
  v_season_id uuid;
  v_timezone text;
  v_home_team_id uuid;
  v_away_team_id uuid;
  v_venue text := nullif(trim(p_venue),'');
  v_reason text := nullif(trim(p_reason),'');
begin
  select season.conference_id,season.id,conference.timezone,game.home_team_id,game.away_team_id
    into v_conference_id,v_season_id,v_timezone,v_home_team_id,v_away_team_id
  from public.games game
  join public.seasons season on season.id=game.season_id
  join public.conferences conference on conference.id=season.conference_id
  where game.id=p_game_id;

  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then
    raise exception 'Only a conference owner can reschedule games.';
  end if;
  if v_venue is null or char_length(v_venue)>120 or char_length(coalesce(p_court,''))>60 or char_length(coalesce(v_reason,''))>500 then
    raise exception 'Check the venue, court, and message.';
  end if;
  if exists(select 1 from public.games game where game.id<>p_game_id and game.season_id=v_season_id and game.status<>'canceled' and (game.starts_at at time zone v_timezone)::date=p_starts_at::date and (game.home_team_id in(v_home_team_id,v_away_team_id) or game.away_team_id in(v_home_team_id,v_away_team_id))) then
    raise exception 'Each team can play only once per day.';
  end if;
  if exists(select 1 from public.games game where game.id<>p_game_id and game.season_id=v_season_id and game.status<>'canceled' and game.starts_at=p_starts_at at time zone v_timezone and lower(coalesce(game.court,''))=lower(coalesce(nullif(trim(p_court),''),''))) then
    raise exception 'That court already has a game at this time.';
  end if;

  update public.games
  set starts_at=p_starts_at at time zone v_timezone,
      venue=v_venue,
      court=nullif(trim(p_court),''),
      status='scheduled',
      status_reason=null,
      status_changed_at=now()
  where id=p_game_id;

  insert into public.notifications(profile_id,notification_type,title,body,link_path,entity_id)
  select distinct player.profile_id,'game_rescheduled','Game rescheduled',
    coalesce(v_reason,'Review the new date, court, and time.'),'/schedule',p_game_id
  from public.registrations registration
  join public.player_profiles player on player.id=registration.player_id
  where registration.team_id in(v_home_team_id,v_away_team_id)
    and registration.status='active'
    and player.profile_id is not null
  on conflict(profile_id,notification_type,entity_id) do update
    set title=excluded.title,body=excluded.body,link_path=excluded.link_path,read_at=null,created_at=now();

  insert into public.activity_log(conference_id,actor_profile_id,action,entity_type,entity_id,summary)
  values(v_conference_id,(select auth.uid()),'reschedule','game',p_game_id::text,'Rescheduled a game');
end;
$$;

revoke all on function public.owner_reschedule_game(uuid,timestamp without time zone,text,text,text) from public;
grant execute on function public.owner_reschedule_game(uuid,timestamp without time zone,text,text,text) to authenticated;
