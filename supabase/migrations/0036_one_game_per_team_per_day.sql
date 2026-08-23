-- Default scheduling rule: one game per team per calendar day.

create or replace function public.owner_save_division_game_day(p_division_id uuid,p_game_date date,p_venue text,p_game_minutes integer,p_games jsonb)
returns integer language plpgsql security definer set search_path=''
as $$
declare v_conference_id uuid;v_season_id uuid;v_timezone text;v_starts_on date;v_ends_on date;v_venue text:=nullif(trim(p_venue),'');v_count integer;
begin
  select season.conference_id,season.id,conference.timezone,season.starts_on,season.ends_on into v_conference_id,v_season_id,v_timezone,v_starts_on,v_ends_on
  from public.divisions division join public.seasons season on season.id=division.season_id join public.conferences conference on conference.id=season.conference_id where division.id=p_division_id;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then raise exception 'Only the conference owner can save this game day.'; end if;
  if not exists(select 1 from public.season_broadcasts where division_id=p_division_id and broadcast_type='roster_final') then raise exception 'Publish this division final roster before scheduling.'; end if;
  if exists(select 1 from public.division_schedule_workflows where division_id=p_division_id and status='final') then raise exception 'This schedule is final. Use schedule updates for later changes.'; end if;
  if p_game_date<v_starts_on or p_game_date>v_ends_on then raise exception 'Choose a date within the season.'; end if;
  if v_venue is null or char_length(v_venue)>120 then raise exception 'Enter a venue of up to 120 characters.'; end if;
  if p_game_minutes<30 or p_game_minutes>180 then raise exception 'Game minutes must be from 30 to 180.'; end if;
  if jsonb_typeof(p_games)<>'array' or jsonb_array_length(p_games)<1 or jsonb_array_length(p_games)>20 then raise exception 'Add from 1 to 20 games for this day.'; end if;

  create temporary table kch_manual_games(home_team_id uuid,away_team_id uuid,game_time time without time zone,court text) on commit drop;
  insert into kch_manual_games
  select (item->>'homeTeamId')::uuid,(item->>'awayTeamId')::uuid,(item->>'time')::time,nullif(trim(item->>'court'),'') from jsonb_array_elements(p_games) item;
  if exists(select 1 from kch_manual_games where home_team_id=away_team_id or court is null or char_length(court)>60) then raise exception 'Check every matchup, time, and court.'; end if;
  if exists(select 1 from kch_manual_games game where not exists(select 1 from public.teams team where team.id=game.home_team_id and team.division_id=p_division_id and team.active) or not exists(select 1 from public.teams team where team.id=game.away_team_id and team.division_id=p_division_id and team.active)) then raise exception 'Every selected team must belong to this division.'; end if;
  if exists(
    select 1 from(
      select home_team_id as team_id from kch_manual_games
      union all
      select away_team_id from kch_manual_games
    ) scheduled_team group by team_id having count(*)>1
  ) then raise exception 'Each team can play only once per day.'; end if;
  if exists(select 1 from kch_manual_games a join kch_manual_games b on a.ctid<b.ctid and lower(a.court)=lower(b.court) and a.game_time=b.game_time) then raise exception 'A court cannot host two games at the same time.'; end if;
  if exists(select 1 from kch_manual_games proposed join public.games existing on existing.season_id=v_season_id and existing.phase='regular' and existing.status<>'canceled' and ((existing.home_team_id=proposed.home_team_id and existing.away_team_id=proposed.away_team_id) or (existing.home_team_id=proposed.away_team_id and existing.away_team_id=proposed.home_team_id))) then raise exception 'One of these round-robin matchups is already scheduled.'; end if;
  if exists(select 1 from kch_manual_games proposed join public.games existing on existing.season_id=v_season_id and existing.status<>'canceled' and (existing.starts_at at time zone v_timezone)::date=p_game_date and (existing.home_team_id in(proposed.home_team_id,proposed.away_team_id) or existing.away_team_id in(proposed.home_team_id,proposed.away_team_id))) then raise exception 'A selected team already has a game that day.'; end if;
  if exists(select 1 from kch_manual_games proposed join public.games existing on existing.season_id=v_season_id and existing.status<>'canceled' and (existing.starts_at at time zone v_timezone)::date=p_game_date and (existing.starts_at at time zone v_timezone)::time=proposed.game_time and lower(coalesce(existing.court,''))=lower(proposed.court)) then raise exception 'A selected court already has a game at that time.'; end if;

  insert into public.games(season_id,home_team_id,away_team_id,starts_at,venue,court,home_uniform,away_uniform,status,phase,duration_minutes)
  select v_season_id,game.home_team_id,game.away_team_id,(p_game_date+game.game_time) at time zone v_timezone,v_venue,game.court,'White','Dark','scheduled','regular',p_game_minutes from kch_manual_games game;
  get diagnostics v_count=row_count;
  insert into public.division_schedule_workflows(division_id,mode,status,updated_by) values(p_division_id,'manual','draft',(select auth.uid()))
  on conflict(division_id) do update set mode='manual',status='draft',updated_at=now(),updated_by=(select auth.uid());
  return v_count;
end;
$$;

create or replace function public.owner_create_division_game(p_division_id uuid,p_home_team_id uuid,p_away_team_id uuid,p_starts_at timestamp without time zone,p_venue text,p_court text default null,p_phase text default 'regular')
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_season_id uuid;v_conference_id uuid;v_timezone text;v_game_id uuid;v_venue text:=nullif(trim(p_venue),'');v_schedule_final boolean;
begin
  select season.id,season.conference_id,conference.timezone into v_season_id,v_conference_id,v_timezone
  from public.divisions division join public.seasons season on season.id=division.season_id join public.conferences conference on conference.id=season.conference_id where division.id=p_division_id;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then raise exception 'Only the conference owner can schedule games.'; end if;
  if not exists(select 1 from public.season_broadcasts where division_id=p_division_id and broadcast_type='roster_final') then raise exception 'Publish this division final roster before scheduling.'; end if;
  if p_phase not in('regular','playoff') or p_home_team_id=p_away_team_id then raise exception 'Choose two different teams and a valid game type.'; end if;
  if v_venue is null or char_length(v_venue)>120 or char_length(coalesce(p_court,''))>60 then raise exception 'Check the venue and court.'; end if;
  if not exists(select 1 from public.teams where id=p_home_team_id and division_id=p_division_id and active) or not exists(select 1 from public.teams where id=p_away_team_id and division_id=p_division_id and active) then raise exception 'Both teams must belong to this division.'; end if;
  if p_phase='playoff' and(not exists(select 1 from public.games game join public.teams team on team.id=game.home_team_id where team.division_id=p_division_id and game.phase='regular') or exists(select 1 from public.games game join public.teams team on team.id=game.home_team_id where team.division_id=p_division_id and game.phase='regular' and(game.home_score is null or game.away_score is null))) then raise exception 'Complete this division round robin and final scores before adding playoffs.'; end if;
  if exists(select 1 from public.games game where game.season_id=v_season_id and game.status<>'canceled' and (game.starts_at at time zone v_timezone)::date=p_starts_at::date and(game.home_team_id in(p_home_team_id,p_away_team_id) or game.away_team_id in(p_home_team_id,p_away_team_id))) then raise exception 'Each team can play only once per day.'; end if;
  if exists(select 1 from public.games game where game.season_id=v_season_id and game.status<>'canceled' and game.starts_at=p_starts_at at time zone v_timezone and lower(coalesce(game.court,''))=lower(coalesce(nullif(trim(p_court),''),''))) then raise exception 'That court already has a game at this time.'; end if;
  insert into public.games(season_id,home_team_id,away_team_id,starts_at,venue,court,home_uniform,away_uniform,phase,duration_minutes)
  values(v_season_id,p_home_team_id,p_away_team_id,p_starts_at at time zone v_timezone,v_venue,nullif(trim(p_court),''),'White','Dark',p_phase,60) returning id into v_game_id;
  select status='final' into v_schedule_final from public.division_schedule_workflows where division_id=p_division_id;
  if coalesce(v_schedule_final,false) then
    insert into public.notifications(profile_id,notification_type,title,body,link_path,entity_id)
    select distinct player.profile_id,'game_scheduled',case when p_phase='playoff' then 'New playoff game scheduled' else 'New game scheduled' end,'A new game was added to your division schedule.','/schedule',v_game_id
    from public.registrations registration join public.player_profiles player on player.id=registration.player_id where registration.team_id in(p_home_team_id,p_away_team_id) and registration.status='active' and player.profile_id is not null;
  end if;
  return v_game_id;
end;
$$;

create or replace function public.owner_update_game(p_game_id uuid,p_starts_at timestamp without time zone,p_venue text,p_court text default null,p_home_uniform text default null,p_away_uniform text default null,p_home_score integer default null,p_away_score integer default null)
returns void language plpgsql security definer set search_path=''
as $$
declare v_conference_id uuid;v_season_id uuid;v_timezone text;v_home_team_id uuid;v_away_team_id uuid;v_venue text:=nullif(trim(p_venue),'');
begin
  select season.conference_id,season.id,conference.timezone,game.home_team_id,game.away_team_id into v_conference_id,v_season_id,v_timezone,v_home_team_id,v_away_team_id
  from public.games game join public.seasons season on season.id=game.season_id join public.conferences conference on conference.id=season.conference_id where game.id=p_game_id;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then raise exception 'Only a conference owner can update games.'; end if;
  if v_venue is null or char_length(v_venue)>120 or char_length(coalesce(p_court,''))>60 then raise exception 'Check the venue and court.'; end if;
  if coalesce(p_home_uniform,'') not in('','White','Dark') or coalesce(p_away_uniform,'') not in('','White','Dark') then raise exception 'Uniform must be White or Dark.'; end if;
  if(p_home_score is null)<>(p_away_score is null) or coalesce(p_home_score,0)<0 or coalesce(p_away_score,0)<0 then raise exception 'Enter both valid scores or leave both blank.'; end if;
  if exists(select 1 from public.games game where game.id<>p_game_id and game.season_id=v_season_id and game.status<>'canceled' and (game.starts_at at time zone v_timezone)::date=p_starts_at::date and(game.home_team_id in(v_home_team_id,v_away_team_id) or game.away_team_id in(v_home_team_id,v_away_team_id))) then raise exception 'Each team can play only once per day.'; end if;
  if exists(select 1 from public.games game where game.id<>p_game_id and game.season_id=v_season_id and game.status<>'canceled' and game.starts_at=p_starts_at at time zone v_timezone and lower(coalesce(game.court,''))=lower(coalesce(nullif(trim(p_court),''),''))) then raise exception 'That court already has a game at this time.'; end if;
  update public.games set starts_at=p_starts_at at time zone v_timezone,venue=v_venue,court=nullif(trim(p_court),''),home_uniform=nullif(p_home_uniform,''),away_uniform=nullif(p_away_uniform,''),home_score=p_home_score,away_score=p_away_score where id=p_game_id;
  insert into public.notifications(profile_id,notification_type,title,body,link_path,entity_id)
  select distinct player.profile_id,'game_updated',case when p_home_score is null then 'Game schedule updated' else 'Final score posted' end,case when p_home_score is null then 'Review the latest game details.' else 'Your game result is ready.' end,'/schedule',p_game_id
  from public.registrations registration join public.player_profiles player on player.id=registration.player_id where registration.team_id in(v_home_team_id,v_away_team_id) and registration.status='active' and player.profile_id is not null
  on conflict(profile_id,notification_type,entity_id) do update set title=excluded.title,body=excluded.body,link_path=excluded.link_path,read_at=null,created_at=now();
  insert into public.activity_log(conference_id,actor_profile_id,action,entity_type,entity_id,summary) values(v_conference_id,(select auth.uid()),'update','game',p_game_id::text,case when p_home_score is null then 'Updated a game' else 'Posted a final score' end);
end;
$$;

revoke all on function public.owner_save_division_game_day(uuid,date,text,integer,jsonb) from public;
revoke all on function public.owner_create_division_game(uuid,uuid,uuid,timestamp without time zone,text,text,text) from public;
revoke all on function public.owner_update_game(uuid,timestamp without time zone,text,text,text,text,integer,integer) from public;
grant execute on function public.owner_save_division_game_day(uuid,date,text,integer,jsonb) to authenticated;
grant execute on function public.owner_create_division_game(uuid,uuid,uuid,timestamp without time zone,text,text,text) to authenticated;
grant execute on function public.owner_update_game(uuid,timestamp without time zone,text,text,text,text,integer,integer) to authenticated;
