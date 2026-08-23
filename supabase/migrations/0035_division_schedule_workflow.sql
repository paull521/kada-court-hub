-- Independent Step 8 schedule workflow for each division.

alter table public.games add column if not exists duration_minutes integer not null default 60;
alter table public.games drop constraint if exists games_duration_minutes_check;
alter table public.games add constraint games_duration_minutes_check check(duration_minutes between 30 and 180);

create table if not exists public.division_schedule_workflows(
  division_id uuid primary key references public.divisions(id) on delete cascade,
  mode text not null check(mode in('manual','kch')),
  status text not null default 'draft' check(status in('draft','final')),
  finalized_at timestamptz,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);
alter table public.division_schedule_workflows enable row level security;
grant select on public.division_schedule_workflows to authenticated;
drop policy if exists "Conference members view division schedule workflows" on public.division_schedule_workflows;
create policy "Conference members view division schedule workflows" on public.division_schedule_workflows for select to authenticated using(
  exists(select 1 from public.divisions division join public.seasons season on season.id=division.season_id where division.id=division_schedule_workflows.division_id and public.user_belongs_to_conference(season.conference_id))
);

insert into public.division_schedule_workflows(division_id,mode,status)
select distinct team.division_id,'manual','draft'
from public.games game join public.teams team on team.id=game.home_team_id
on conflict(division_id) do nothing;

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
  if exists(select 1 from kch_manual_games a join kch_manual_games b on a.ctid<b.ctid and ((a.home_team_id in(b.home_team_id,b.away_team_id) or a.away_team_id in(b.home_team_id,b.away_team_id)) and a.game_time=b.game_time or lower(a.court)=lower(b.court) and a.game_time=b.game_time)) then raise exception 'A team or court cannot be scheduled twice at the same time.'; end if;
  if exists(select 1 from kch_manual_games proposed join public.games existing on existing.season_id=v_season_id and existing.phase='regular' and existing.status<>'canceled' and ((existing.home_team_id=proposed.home_team_id and existing.away_team_id=proposed.away_team_id) or (existing.home_team_id=proposed.away_team_id and existing.away_team_id=proposed.home_team_id))) then raise exception 'One of these round-robin matchups is already scheduled.'; end if;
  if exists(select 1 from kch_manual_games proposed join public.games existing on existing.season_id=v_season_id and existing.status<>'canceled' and (existing.starts_at at time zone v_timezone)::date=p_game_date and (existing.starts_at at time zone v_timezone)::time=proposed.game_time and (lower(coalesce(existing.court,''))=lower(proposed.court) or existing.home_team_id in(proposed.home_team_id,proposed.away_team_id) or existing.away_team_id in(proposed.home_team_id,proposed.away_team_id))) then raise exception 'A selected team or court already has a game at that time.'; end if;

  insert into public.games(season_id,home_team_id,away_team_id,starts_at,venue,court,home_uniform,away_uniform,status,phase,duration_minutes)
  select v_season_id,game.home_team_id,game.away_team_id,(p_game_date+game.game_time) at time zone v_timezone,v_venue,game.court,'White','Dark','scheduled','regular',p_game_minutes from kch_manual_games game;
  get diagnostics v_count=row_count;
  insert into public.division_schedule_workflows(division_id,mode,status,updated_by) values(p_division_id,'manual','draft',(select auth.uid()))
  on conflict(division_id) do update set mode='manual',status='draft',updated_at=now(),updated_by=(select auth.uid());
  return v_count;
end;
$$;

create or replace function public.owner_generate_division_schedule(p_division_id uuid,p_first_game_date date,p_first_game_time time without time zone,p_playing_days integer[],p_court_count integer,p_game_minutes integer,p_games_per_day integer,p_venue text,p_double_round_robin boolean default false)
returns integer language plpgsql security definer set search_path=''
as $$
declare v_conference_id uuid;v_season_id uuid;v_timezone text;v_ends_on date;v_venue text:=nullif(trim(p_venue),'');v_teams uuid[];v_team_count integer;v_round integer;v_pair integer;v_home uuid;v_away uuid;v_leg integer;v_game_count integer:=0;v_round_key integer:=-1;v_pair_slot integer:=0;v_date date;v_starts_at timestamptz;pairing record;
begin
  select season.conference_id,season.id,conference.timezone,season.ends_on into v_conference_id,v_season_id,v_timezone,v_ends_on
  from public.divisions division join public.seasons season on season.id=division.season_id join public.conferences conference on conference.id=season.conference_id where division.id=p_division_id;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then raise exception 'Only the conference owner can build this schedule.'; end if;
  if not exists(select 1 from public.season_broadcasts where division_id=p_division_id and broadcast_type='roster_final') then raise exception 'Publish this division final roster before scheduling.'; end if;
  if exists(select 1 from public.games game join public.teams team on team.id=game.home_team_id where team.division_id=p_division_id and game.phase='regular') then raise exception 'This division already has a draft. Continue on the Schedule page.'; end if;
  if v_venue is null or char_length(v_venue)>120 then raise exception 'Enter a venue of up to 120 characters.'; end if;
  if coalesce(array_length(p_playing_days,1),0)<1 or exists(select 1 from unnest(p_playing_days) day_number where day_number<0 or day_number>6) then raise exception 'Choose at least one playing day.'; end if;
  if p_court_count<1 or p_court_count>10 or p_game_minutes<30 or p_game_minutes>180 or p_games_per_day<1 or p_games_per_day>30 then raise exception 'Check courts, game minutes, and games per day.'; end if;
  select array_agg(team.id order by team.name) into v_teams from public.teams team where team.division_id=p_division_id and team.active;
  v_team_count:=coalesce(array_length(v_teams,1),0);if v_team_count<2 then raise exception 'Add at least two active teams.'; end if;
  if mod(v_team_count,2)=1 then v_teams:=array_append(v_teams,null::uuid);v_team_count:=v_team_count+1;end if;
  create temporary table kch_division_pairs(round_key integer,pair_number integer,home_team_id uuid,away_team_id uuid) on commit drop;
  for v_leg in 1..case when p_double_round_robin then 2 else 1 end loop
    for v_round in 1..v_team_count-1 loop
      for v_pair in 1..v_team_count/2 loop
        v_home:=v_teams[v_pair];v_away:=v_teams[v_team_count-v_pair+1];
        if v_home is not null and v_away is not null then
          if mod(v_round+v_pair,2)=0 then insert into kch_division_pairs values((v_leg-1)*(v_team_count-1)+v_round,v_pair,case when v_leg=1 then v_home else v_away end,case when v_leg=1 then v_away else v_home end);
          else insert into kch_division_pairs values((v_leg-1)*(v_team_count-1)+v_round,v_pair,case when v_leg=1 then v_away else v_home end,case when v_leg=1 then v_home else v_away end);end if;
        end if;
      end loop;
      v_teams:=array[v_teams[1],v_teams[v_team_count]]||v_teams[2:v_team_count-1];
    end loop;
  end loop;
  v_date:=p_first_game_date;
  while not (extract(dow from v_date)::integer=any(p_playing_days)) loop v_date:=v_date+1;end loop;
  for pairing in select * from kch_division_pairs order by round_key,pair_number loop
    if v_round_key<>pairing.round_key then
      if v_round_key<>-1 then v_date:=v_date+1;while not (extract(dow from v_date)::integer=any(p_playing_days)) loop v_date:=v_date+1;end loop;end if;
      v_round_key:=pairing.round_key;v_pair_slot:=0;
    elsif v_pair_slot>=p_games_per_day then
      v_date:=v_date+1;while not (extract(dow from v_date)::integer=any(p_playing_days)) loop v_date:=v_date+1;end loop;v_pair_slot:=0;
    end if;
    if v_date>v_ends_on then raise exception 'The draft extends past the season end date. Add playing days or games per day.'; end if;
    v_starts_at:=(v_date+p_first_game_time+(floor(v_pair_slot::numeric/p_court_count)::integer*p_game_minutes*interval '1 minute')) at time zone v_timezone;
    insert into public.games(season_id,home_team_id,away_team_id,starts_at,venue,court,home_uniform,away_uniform,status,phase,duration_minutes)
    values(v_season_id,pairing.home_team_id,pairing.away_team_id,v_starts_at,v_venue,'Court '||((v_pair_slot%p_court_count)+1),'White','Dark','scheduled','regular',p_game_minutes);
    v_game_count:=v_game_count+1;v_pair_slot:=v_pair_slot+1;
  end loop;
  insert into public.division_schedule_workflows(division_id,mode,status,updated_by) values(p_division_id,'kch','draft',(select auth.uid()))
  on conflict(division_id) do update set mode='kch',status='draft',updated_at=now(),updated_by=(select auth.uid());
  insert into public.activity_log(conference_id,actor_profile_id,action,entity_type,entity_id,summary) values(v_conference_id,(select auth.uid()),'generate','division_schedule',p_division_id::text,'Generated '||v_game_count||' draft games');
  return v_game_count;
end;
$$;

create or replace function public.owner_finalize_division_schedule(p_division_id uuid)
returns void language plpgsql security definer set search_path=''
as $$
declare v_conference_id uuid;v_season_id uuid;v_season_name text;v_division_name text;v_expected integer;v_actual integer;
begin
  select season.conference_id,season.id,season.name,division.name into v_conference_id,v_season_id,v_season_name,v_division_name from public.divisions division join public.seasons season on season.id=division.season_id where division.id=p_division_id;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then raise exception 'Only the conference owner can finalize this schedule.'; end if;
  select count(*)*(count(*)-1)/2 into v_expected from public.teams where division_id=p_division_id and active;
  select count(*) into v_actual from(select least(game.home_team_id,game.away_team_id),greatest(game.home_team_id,game.away_team_id) from public.games game join public.teams team on team.id=game.home_team_id where team.division_id=p_division_id and game.phase='regular' and game.status<>'canceled' group by 1,2) matchups;
  if v_actual<v_expected then raise exception 'Complete every round-robin matchup before finalizing.'; end if;
  insert into public.division_schedule_workflows(division_id,mode,status,finalized_at,updated_by) values(p_division_id,'manual','final',now(),(select auth.uid()))
  on conflict(division_id) do update set status='final',finalized_at=now(),updated_at=now(),updated_by=(select auth.uid());
  insert into public.notifications(profile_id,notification_type,title,body,link_path,entity_id)
  select distinct player.profile_id,'schedule_published',v_season_name||' · '||v_division_name||' schedule published','Your division schedule is now available.','/schedule',p_division_id
  from public.registrations registration join public.player_profiles player on player.id=registration.player_id where registration.division_id=p_division_id and registration.status='active' and player.profile_id is not null
  on conflict(profile_id,notification_type,entity_id) do update set title=excluded.title,body=excluded.body,link_path=excluded.link_path,read_at=null,created_at=now();
  if not exists(select 1 from public.divisions division where division.season_id=v_season_id and not exists(select 1 from public.division_schedule_workflows workflow where workflow.division_id=division.id and workflow.status='final')) then update public.seasons set setup_stage=7 where id=v_season_id;end if;
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
  if p_phase='playoff' and(
    not exists(select 1 from public.games game join public.teams team on team.id=game.home_team_id where team.division_id=p_division_id and game.phase='regular')
    or exists(select 1 from public.games game join public.teams team on team.id=game.home_team_id where team.division_id=p_division_id and game.phase='regular' and(game.home_score is null or game.away_score is null))
  ) then raise exception 'Complete this division round robin and final scores before adding playoffs.'; end if;
  if exists(select 1 from public.games game where game.season_id=v_season_id and game.status<>'canceled' and game.starts_at=p_starts_at at time zone v_timezone and(lower(coalesce(game.court,''))=lower(coalesce(nullif(trim(p_court),''),'')) or game.home_team_id in(p_home_team_id,p_away_team_id) or game.away_team_id in(p_home_team_id,p_away_team_id))) then raise exception 'A selected team or court already has a game at that time.'; end if;
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

revoke all on function public.owner_save_division_game_day(uuid,date,text,integer,jsonb) from public;
revoke all on function public.owner_generate_division_schedule(uuid,date,time without time zone,integer[],integer,integer,integer,text,boolean) from public;
revoke all on function public.owner_finalize_division_schedule(uuid) from public;
grant execute on function public.owner_save_division_game_day(uuid,date,text,integer,jsonb) to authenticated;
grant execute on function public.owner_generate_division_schedule(uuid,date,time without time zone,integer[],integer,integer,integer,text,boolean) to authenticated;
grant execute on function public.owner_finalize_division_schedule(uuid) to authenticated;
grant execute on function public.owner_create_division_game(uuid,uuid,uuid,timestamp without time zone,text,text,text) to authenticated;
