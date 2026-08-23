-- Uniform photo uploads, guided setup Step 7, automatic round-robin scheduling,
-- and recoverable game postponement/cancellation.

alter table public.seasons drop constraint if exists seasons_setup_stage_check;
alter table public.seasons add constraint seasons_setup_stage_check check (setup_stage between 1 and 7);

alter table public.division_uniform_settings add column if not exists dark_image_path text;
alter table public.division_uniform_settings add column if not exists light_image_path text;

alter table public.games add column if not exists status text not null default 'scheduled';
alter table public.games drop constraint if exists games_status_check;
alter table public.games add constraint games_status_check check (status in ('scheduled','postponed','canceled'));
alter table public.games add column if not exists status_reason text;
alter table public.games add column if not exists status_changed_at timestamptz;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('uniform-photos', 'uniform-photos', true, 8388608, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Owners upload division uniform photos" on storage.objects;
create policy "Owners upload division uniform photos" on storage.objects for insert to authenticated
with check (
  bucket_id = 'uniform-photos'
  and exists (
    select 1 from public.divisions division
    join public.seasons season on season.id = division.season_id
    where division.id = ((storage.foldername(storage.objects.name))[1])::uuid
      and public.user_has_conference_role(season.conference_id, array['owner']::public.conference_role[])
  )
);
drop policy if exists "Owners update division uniform photos" on storage.objects;
create policy "Owners update division uniform photos" on storage.objects for update to authenticated
using (
  bucket_id = 'uniform-photos'
  and exists (
    select 1 from public.divisions division
    join public.seasons season on season.id = division.season_id
    where division.id = ((storage.foldername(storage.objects.name))[1])::uuid
      and public.user_has_conference_role(season.conference_id, array['owner']::public.conference_role[])
  )
);
drop policy if exists "Owners delete division uniform photos" on storage.objects;
create policy "Owners delete division uniform photos" on storage.objects for delete to authenticated
using (
  bucket_id = 'uniform-photos'
  and exists (
    select 1 from public.divisions division
    join public.seasons season on season.id = division.season_id
    where division.id = ((storage.foldername(storage.objects.name))[1])::uuid
      and public.user_has_conference_role(season.conference_id, array['owner']::public.conference_role[])
  )
);

create or replace function public.owner_update_division_uniform_images(
  p_division_id uuid,
  p_dark_image_path text default null,
  p_light_image_path text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conference_id uuid;
begin
  select season.conference_id into v_conference_id
  from public.divisions division
  join public.seasons season on season.id = division.season_id
  where division.id = p_division_id;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id, array['owner']::public.conference_role[]) then
    raise exception 'Only a conference owner can update division uniform photos.';
  end if;
  insert into public.division_uniform_settings (division_id, dark_image_path, light_image_path, updated_by)
  values (p_division_id, nullif(p_dark_image_path,''), nullif(p_light_image_path,''), (select auth.uid()))
  on conflict (division_id) do update
    set dark_image_path = coalesce(nullif(p_dark_image_path,''), division_uniform_settings.dark_image_path),
        light_image_path = coalesce(nullif(p_light_image_path,''), division_uniform_settings.light_image_path),
        updated_at = now(), updated_by = (select auth.uid());
end;
$$;

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
  if exists (select 1 from public.games where season_id = p_season_id) then
    raise exception 'This season already has games. Use the current schedule or edit games individually.';
  end if;
  if v_venue is null or char_length(v_venue) > 120 then raise exception 'Enter a venue of up to 120 characters.'; end if;
  if coalesce(array_length(p_courts,1),0) < 1 or exists (select 1 from unnest(p_courts) court where nullif(trim(court),'') is null or char_length(court)>60) then
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
    select id,name from public.divisions where season_id=p_season_id order by name
  loop
    select array_agg(id order by name) into v_teams
    from public.teams where division_id=v_division.id and active;
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
  insert into public.games (season_id,home_team_id,away_team_id,starts_at,venue,court,home_uniform,away_uniform,status)
  select p_season_id, home_team_id, away_team_id,
         (
           p_first_game_date
           + ((plan.start_week+(slot_in_round/v_capacity)::integer) * 7)
           + p_first_game_time
           + (((slot_in_round % v_capacity) / array_length(p_courts,1))::integer * p_game_minutes * interval '1 minute')
         ) at time zone v_timezone,
         v_venue,
         trim(p_courts[(slot_in_round % array_length(p_courts,1))::integer+1]),
         'White','Dark','scheduled'
  from ordered_games games join round_plan plan using(overall_round);
  get diagnostics v_game_count = row_count;
  if v_game_count < 1 then raise exception 'No matchups could be generated.'; end if;
  select max(starts_at at time zone v_timezone)::date into v_last_game_date from public.games where season_id=p_season_id;
  if v_last_game_date>v_ends_on then
    raise exception 'The generated schedule extends past the season end date. Add courts or game slots, or choose an earlier first date.';
  end if;

  update public.seasons set setup_stage=7 where id=p_season_id;
  insert into public.notifications (profile_id,notification_type,title,body,link_path,entity_id)
  select distinct player.profile_id,'schedule_published','Season schedule ready',
         'Your working season schedule is now available.','/schedule',p_season_id
  from public.registrations registration
  join public.player_profiles player on player.id=registration.player_id
  where registration.season_id=p_season_id and registration.status='active' and player.profile_id is not null
  on conflict (profile_id,notification_type,entity_id) do update
    set body=excluded.body,link_path=excluded.link_path,read_at=null,created_at=now();
  insert into public.activity_log (conference_id,actor_profile_id,action,entity_type,entity_id,summary)
  values (v_conference_id,(select auth.uid()),'generate','season_schedule',p_season_id::text,'Generated '||v_game_count||' schedule games');
  return v_game_count;
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
  select conference_id,setup_stage into v_conference_id,v_stage from public.seasons where id=p_season_id for update;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then
    raise exception 'Only a conference owner can complete a schedule.';
  end if;
  if v_stage <> 6 then raise exception 'This schedule step is not ready.'; end if;
  if not exists(select 1 from public.games where season_id=p_season_id) then raise exception 'Add or generate at least one game first.'; end if;
  update public.seasons set setup_stage=7 where id=p_season_id;
  insert into public.notifications (profile_id,notification_type,title,body,link_path,entity_id)
  select distinct player.profile_id,'schedule_published','Season schedule ready',
         'Your working season schedule is now available.','/schedule',p_season_id
  from public.registrations registration
  join public.player_profiles player on player.id=registration.player_id
  where registration.season_id=p_season_id and registration.status='active' and player.profile_id is not null
  on conflict (profile_id,notification_type,entity_id) do update
    set body=excluded.body,link_path=excluded.link_path,read_at=null,created_at=now();
end;
$$;

create or replace function public.owner_change_game_status(p_game_id uuid,p_status text,p_reason text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conference_id uuid;
  v_home_team_id uuid;
  v_away_team_id uuid;
  v_reason text := nullif(trim(p_reason),'');
begin
  select season.conference_id,game.home_team_id,game.away_team_id
    into v_conference_id,v_home_team_id,v_away_team_id
  from public.games game join public.seasons season on season.id=game.season_id
  where game.id=p_game_id;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then
    raise exception 'Only a conference owner can change a game status.';
  end if;
  if p_status not in ('scheduled','postponed','canceled') then raise exception 'Choose a valid game status.'; end if;
  if p_status <> 'scheduled' and (v_reason is null or char_length(v_reason)>500) then raise exception 'Enter a reason of up to 500 characters.'; end if;
  update public.games set status=p_status,status_reason=case when p_status='scheduled' then null else v_reason end,status_changed_at=now() where id=p_game_id;
  insert into public.notifications (profile_id,notification_type,title,body,link_path,entity_id)
  select distinct player.profile_id,'game_'||p_status,
         case p_status when 'postponed' then 'Game postponed' when 'canceled' then 'Game canceled' else 'Game rescheduled' end,
         case when p_status='scheduled' then 'Review the updated date, court, and time.' else v_reason end,
         '/schedule',p_game_id
  from public.registrations registration
  join public.player_profiles player on player.id=registration.player_id
  where registration.team_id in(v_home_team_id,v_away_team_id) and registration.status='active' and player.profile_id is not null
  on conflict (profile_id,notification_type,entity_id) do update
    set title=excluded.title,body=excluded.body,link_path=excluded.link_path,read_at=null,created_at=now();
end;
$$;

create or replace function public.captain_create_roster_request(
  p_team_id uuid,
  p_request_type text,
  p_details text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_season_id uuid;
  v_setup_stage smallint;
  v_request_id uuid;
  v_details text := nullif(trim(p_details), '');
begin
  select division.season_id, season.setup_stage into v_season_id, v_setup_stage
  from public.teams team join public.divisions division on division.id=team.division_id
  join public.seasons season on season.id=division.season_id where team.id=p_team_id;
  if v_season_id is null or not exists (
    select 1 from public.registrations registration join public.player_profiles player on player.id=registration.player_id
    where registration.team_id=p_team_id and player.profile_id=(select auth.uid())
      and registration.role_label in ('Captain','Co-captain')
  ) then raise exception 'Only this team''s captain or co-captain can submit roster requests.'; end if;
  if v_setup_stage < 6 then raise exception 'Roster requests open after the owner publishes the roster draft.'; end if;
  if p_request_type not in ('player_update','trade','add_player','remove_player','other') then raise exception 'Choose a valid request type.'; end if;
  if v_details is null or char_length(v_details)>1000 then raise exception 'Enter request details of 1 to 1000 characters.'; end if;
  insert into public.roster_change_requests (season_id,team_id,requested_by,request_type,details)
  values (v_season_id,p_team_id,(select auth.uid()),p_request_type,v_details) returning id into v_request_id;
  return v_request_id;
end;
$$;

revoke all on function public.owner_update_division_uniform_images(uuid,text,text) from public;
revoke all on function public.owner_generate_season_schedule(uuid,date,time without time zone,integer,integer,text,text[],boolean) from public;
revoke all on function public.owner_complete_existing_schedule(uuid) from public;
revoke all on function public.owner_change_game_status(uuid,text,text) from public;
grant execute on function public.owner_update_division_uniform_images(uuid,text,text) to authenticated;
grant execute on function public.owner_generate_season_schedule(uuid,date,time without time zone,integer,integer,text,text[],boolean) to authenticated;
grant execute on function public.owner_complete_existing_schedule(uuid) to authenticated;
grant execute on function public.owner_change_game_status(uuid,text,text) to authenticated;
