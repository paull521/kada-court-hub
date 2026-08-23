-- Schedule workflow: manual or KCH-generated drafts, explicit finalization,
-- and playoff scheduling only after round-robin results are complete.

alter table public.games add column if not exists phase text not null default 'regular';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'games_phase_check' and conrelid = 'public.games'::regclass
  ) then
    alter table public.games add constraint games_phase_check check (phase in ('regular','playoff'));
  end if;
end;
$$;

create index if not exists games_season_phase_idx on public.games(season_id,phase,starts_at);

create or replace function public.owner_generate_season_schedule(
  p_season_id uuid,
  p_first_game_date date,
  p_first_game_time time without time zone,
  p_game_minutes integer,
  p_games_per_court integer,
  p_venue text,
  p_courts text[],
  p_double_round_robin boolean default false
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conference_id uuid;
  v_timezone text;
  v_stage smallint;
  v_game_count integer;
  v_capacity integer;
  v_venue text := nullif(trim(p_venue),'');
  v_ends_on date;
  v_last_game_date date;
  v_division record;
  v_teams uuid[];
  v_team_count integer;
  v_round integer;
  v_pair integer;
  v_home uuid;
  v_away uuid;
begin
  select season.conference_id, conference.timezone, season.setup_stage, season.ends_on
    into v_conference_id, v_timezone, v_stage, v_ends_on
  from public.seasons season
  join public.conferences conference on conference.id = season.conference_id
  where season.id = p_season_id for update;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id, array['owner']::public.conference_role[]) then
    raise exception 'Only a conference owner can build a schedule.';
  end if;
  if v_stage <> 6 then raise exception 'Complete and publish the roster draft before building the schedule.'; end if;
  if exists (select 1 from public.games game where game.season_id = p_season_id) then
    raise exception 'This season already has a draft. Continue editing it on the Schedule page.';
  end if;
  if v_venue is null or char_length(v_venue) > 120 then raise exception 'Enter a venue of up to 120 characters.'; end if;
  if coalesce(array_length(p_courts,1),0) < 1 or exists (select 1 from unnest(p_courts) court_name where nullif(trim(court_name),'') is null or char_length(court_name)>60) then
    raise exception 'Enter at least one valid court.';
  end if;
  if p_game_minutes < 30 or p_game_minutes > 180 or p_games_per_court < 1 or p_games_per_court > 12 then
    raise exception 'Check the game length and games per court.';
  end if;
  if exists (
    select 1 from public.divisions division
    where division.season_id = p_season_id
      and (select count(*) from public.teams team where team.division_id=division.id and team.active) < 2
  ) then raise exception 'Every division needs at least two active teams.'; end if;

  v_capacity := array_length(p_courts,1) * p_games_per_court;
  drop table if exists pg_temp.kch_schedule_pairs;
  create temporary table kch_schedule_pairs (
    division_id uuid,
    division_name text,
    round_number integer,
    pair_number integer,
    leg integer,
    home_team_id uuid,
    away_team_id uuid
  ) on commit drop;

  for v_division in
    select division.id,division.name from public.divisions division where division.season_id=p_season_id order by division.name
  loop
    select array_agg(team.id order by team.name) into v_teams
    from public.teams team where team.division_id=v_division.id and team.active;
    v_team_count := array_length(v_teams,1);
    if mod(v_team_count,2)=1 then
      v_teams := array_append(v_teams,null::uuid);
      v_team_count := v_team_count+1;
    end if;
    for v_round in 1..v_team_count-1 loop
      for v_pair in 1..v_team_count/2 loop
        v_home := v_teams[v_pair];
        v_away := v_teams[v_team_count-v_pair+1];
        if v_home is not null and v_away is not null then
          if mod(v_round+v_pair,2)=0 then
            insert into pg_temp.kch_schedule_pairs values(v_division.id,v_division.name,v_round,v_pair,1,v_home,v_away);
            if p_double_round_robin then insert into pg_temp.kch_schedule_pairs values(v_division.id,v_division.name,v_round,v_pair,2,v_away,v_home); end if;
          else
            insert into pg_temp.kch_schedule_pairs values(v_division.id,v_division.name,v_round,v_pair,1,v_away,v_home);
            if p_double_round_robin then insert into pg_temp.kch_schedule_pairs values(v_division.id,v_division.name,v_round,v_pair,2,v_home,v_away); end if;
          end if;
        end if;
      end loop;
      v_teams := array[v_teams[1],v_teams[v_team_count]] || v_teams[2:v_team_count-1];
    end loop;
  end loop;

  with ordered_games as (
    select pairings.*,
           ((leg-1)*1000+round_number) overall_round,
           row_number() over(partition by leg,round_number order by division_name,pair_number)-1 slot_in_round
    from pg_temp.kch_schedule_pairs pairings
  ), round_sizes as (
    select overall_round,ceil(count(*)::numeric/v_capacity)::integer weeks_needed
    from ordered_games group by overall_round
  ), round_plan as (
    select overall_round,weeks_needed,
           coalesce(sum(weeks_needed) over(order by overall_round rows between unbounded preceding and 1 preceding),0)::integer start_week
    from round_sizes
  )
  insert into public.games (season_id,home_team_id,away_team_id,starts_at,venue,court,home_uniform,away_uniform,status,phase)
  select p_season_id, home_team_id, away_team_id,
         (
           p_first_game_date
           + ((plan.start_week+(slot_in_round/v_capacity)::integer) * 7)
           + p_first_game_time
           + (((slot_in_round % v_capacity) / array_length(p_courts,1))::integer * p_game_minutes * interval '1 minute')
         ) at time zone v_timezone,
         v_venue,
         trim(p_courts[(slot_in_round % array_length(p_courts,1))::integer+1]),
         'White','Dark','scheduled','regular'
  from ordered_games generated join round_plan plan using(overall_round);
  get diagnostics v_game_count = row_count;
  if v_game_count < 1 then raise exception 'No matchups could be generated.'; end if;
  select max(game.starts_at at time zone v_timezone)::date into v_last_game_date from public.games game where game.season_id=p_season_id;
  if v_last_game_date>v_ends_on then
    raise exception 'The generated schedule extends past the season end date. Add courts or game slots, or choose an earlier first date.';
  end if;

  insert into public.activity_log (conference_id,actor_profile_id,action,entity_type,entity_id,summary)
  values (v_conference_id,(select auth.uid()),'generate','season_schedule',p_season_id::text,'Generated '||v_game_count||' draft round-robin games');
  return v_game_count;
end;
$$;

drop function if exists public.owner_create_division_game(uuid,uuid,uuid,timestamp without time zone,text,text);

create or replace function public.owner_create_division_game(
  p_division_id uuid,
  p_home_team_id uuid,
  p_away_team_id uuid,
  p_starts_at timestamp without time zone,
  p_venue text,
  p_court text default null,
  p_phase text default 'regular'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_season_id uuid;
  v_conference_id uuid;
  v_timezone text;
  v_stage smallint;
  v_game_id uuid;
  v_venue text := nullif(trim(p_venue), '');
begin
  select season.id,season.conference_id,conference.timezone,season.setup_stage
    into v_season_id,v_conference_id,v_timezone,v_stage
  from public.divisions division
  join public.seasons season on season.id=division.season_id
  join public.conferences conference on conference.id=season.conference_id
  where division.id=p_division_id;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then
    raise exception 'Only a conference owner can schedule games.';
  end if;
  if v_stage < 6 then raise exception 'Complete and publish the roster draft before scheduling games.'; end if;
  if p_phase not in ('regular','playoff') then raise exception 'Choose a valid game type.'; end if;
  if p_phase='playoff' and (
    not exists(select 1 from public.games game where game.season_id=v_season_id and game.phase='regular')
    or exists(select 1 from public.games game where game.season_id=v_season_id and game.phase='regular' and (game.home_score is null or game.away_score is null))
  ) then raise exception 'Complete every round-robin game and final score before adding playoffs.'; end if;
  if p_home_team_id=p_away_team_id then raise exception 'Choose two different teams.'; end if;
  if v_venue is null or char_length(v_venue)>120 then raise exception 'Enter a venue of up to 120 characters.'; end if;
  if char_length(coalesce(p_court,''))>60 then raise exception 'Enter a shorter court name.'; end if;
  if not exists(select 1 from public.teams team where team.id=p_home_team_id and team.division_id=p_division_id and team.active)
     or not exists(select 1 from public.teams team where team.id=p_away_team_id and team.division_id=p_division_id and team.active) then
    raise exception 'Both teams must belong to this division.';
  end if;

  insert into public.games (season_id,home_team_id,away_team_id,starts_at,venue,court,home_uniform,away_uniform,phase)
  values (v_season_id,p_home_team_id,p_away_team_id,p_starts_at at time zone v_timezone,v_venue,nullif(trim(p_court),''),'White','Dark',p_phase)
  returning id into v_game_id;

  if v_stage>=7 then
    insert into public.notifications (profile_id,notification_type,title,body,link_path,entity_id)
    select distinct player.profile_id,'game_scheduled',case when p_phase='playoff' then 'New playoff game scheduled' else 'New game scheduled' end,
           'A new game was added to your schedule.','/schedule',v_game_id
    from public.registrations registration
    join public.player_profiles player on player.id=registration.player_id
    where registration.team_id in(p_home_team_id,p_away_team_id) and registration.status='active' and player.profile_id is not null
    on conflict (profile_id,notification_type,entity_id) do update
      set title=excluded.title,body=excluded.body,link_path=excluded.link_path,read_at=null,created_at=now();
  end if;

  insert into public.activity_log (conference_id,actor_profile_id,action,entity_type,entity_id,summary)
  values (v_conference_id,(select auth.uid()),'create','game',v_game_id::text,
          case when p_phase='playoff' then 'Scheduled a playoff game' when v_stage>=7 then 'Scheduled a regular-season game' else 'Added a regular-season game to the draft' end);
  return v_game_id;
end;
$$;

create or replace function public.owner_complete_existing_schedule(p_season_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conference_id uuid;
  v_stage smallint;
begin
  select season.conference_id,season.setup_stage into v_conference_id,v_stage
  from public.seasons season where season.id=p_season_id for update;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then
    raise exception 'Only a conference owner can finalize a schedule.';
  end if;
  if v_stage<>6 then raise exception 'This schedule is already final or is not ready.'; end if;
  if not exists(select 1 from public.games game where game.season_id=p_season_id and game.phase='regular') then
    raise exception 'Add or generate at least one round-robin game first.';
  end if;
  update public.seasons set setup_stage=7 where id=p_season_id;
  insert into public.notifications (profile_id,notification_type,title,body,link_path,entity_id)
  select distinct player.profile_id,'schedule_published','Final season schedule published',
         'Your season schedule is now available.','/schedule',p_season_id
  from public.registrations registration
  join public.player_profiles player on player.id=registration.player_id
  where registration.season_id=p_season_id and registration.status='active' and player.profile_id is not null
  on conflict (profile_id,notification_type,entity_id) do update
    set title=excluded.title,body=excluded.body,link_path=excluded.link_path,read_at=null,created_at=now();
  insert into public.activity_log (conference_id,actor_profile_id,action,entity_type,entity_id,summary)
  values (v_conference_id,(select auth.uid()),'finalize','season_schedule',p_season_id::text,'Finalized and published the season schedule');
end;
$$;

revoke all on function public.owner_generate_season_schedule(uuid,date,time without time zone,integer,integer,text,text[],boolean) from public;
revoke all on function public.owner_create_division_game(uuid,uuid,uuid,timestamp without time zone,text,text,text) from public;
revoke all on function public.owner_complete_existing_schedule(uuid) from public;
grant execute on function public.owner_generate_season_schedule(uuid,date,time without time zone,integer,integer,text,text[],boolean) to authenticated;
grant execute on function public.owner_create_division_game(uuid,uuid,uuid,timestamp without time zone,text,text,text) to authenticated;
grant execute on function public.owner_complete_existing_schedule(uuid) to authenticated;
