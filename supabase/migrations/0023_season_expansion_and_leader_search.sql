-- Season expansion plus searchable conference-directory leaders.

create or replace function public.owner_create_divisions(p_season_id uuid,p_names text[])
returns integer
language plpgsql
security definer
set search_path=''
as $$
declare
  v_conference_id uuid;
  v_stage smallint;
  v_count integer;
  v_existing integer;
  v_requested integer;
begin
  select season.conference_id,season.setup_stage into v_conference_id,v_stage
  from public.seasons season where season.id=p_season_id;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then
    raise exception 'Only this conference owner can create divisions.';
  end if;
  if v_stage not in (1,7) then raise exception 'Finish the current setup before expanding this season.'; end if;
  if coalesce(array_length(p_names,1),0)<1 or array_length(p_names,1)>10 then raise exception 'Choose from 1 to 10 divisions.'; end if;
  if exists(select 1 from unnest(p_names) division_name where nullif(trim(division_name),'') is null or char_length(trim(division_name))>80) then
    raise exception 'Enter every division name using up to 80 characters.';
  end if;
  select count(*) into v_existing from public.divisions division where division.season_id=p_season_id;
  select count(distinct lower(trim(division_name))) into v_requested from unnest(p_names) division_name;
  if v_existing+v_requested>10 then raise exception 'A season can have no more than 10 divisions.'; end if;
  insert into public.divisions(season_id,name)
  select p_season_id,clean_name from (select distinct trim(division_name) clean_name from unnest(p_names) division_name) names
  on conflict(season_id,name) do nothing;
  get diagnostics v_count=row_count;
  insert into public.activity_log(conference_id,actor_profile_id,action,entity_type,entity_id,summary)
  values(v_conference_id,(select auth.uid()),'create','divisions',p_season_id::text,'Added '||v_count||' divisions');
  return v_count;
end;
$$;

create or replace function public.owner_create_teams(p_division_id uuid,p_names text[])
returns integer
language plpgsql
security definer
set search_path=''
as $$
declare
  v_conference_id uuid;
  v_stage smallint;
  v_count integer;
begin
  select season.conference_id,season.setup_stage into v_conference_id,v_stage
  from public.divisions division join public.seasons season on season.id=division.season_id
  where division.id=p_division_id;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then
    raise exception 'Only this conference owner can create teams.';
  end if;
  if v_stage not in (2,7) then raise exception 'Team setup is not currently open.'; end if;
  if coalesce(array_length(p_names,1),0)<1 or array_length(p_names,1)>30 then raise exception 'Choose from 1 to 30 teams.'; end if;
  if exists(select 1 from unnest(p_names) team_name where nullif(trim(team_name),'') is null or char_length(trim(team_name))>80) then
    raise exception 'Enter every team name using up to 80 characters.';
  end if;
  insert into public.teams(division_id,name,active)
  select p_division_id,clean_name,true from (select distinct trim(team_name) clean_name from unnest(p_names) team_name) names
  on conflict(division_id,name) do update set active=true;
  get diagnostics v_count=row_count;
  insert into public.activity_log(conference_id,actor_profile_id,action,entity_type,entity_id,summary)
  values(v_conference_id,(select auth.uid()),'create','teams',p_division_id::text,'Saved '||v_count||' teams');
  return v_count;
end;
$$;

create or replace function public.owner_assign_directory_leader(p_team_id uuid,p_player_id uuid,p_role text)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_conference_id uuid;
  v_season_id uuid;
  v_registration_id uuid;
  v_existing_team_id uuid;
begin
  select season.conference_id,season.id into v_conference_id,v_season_id
  from public.teams team
  join public.divisions division on division.id=team.division_id
  join public.seasons season on season.id=division.season_id
  where team.id=p_team_id;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then
    raise exception 'Only this conference owner can assign team leaders.';
  end if;
  if p_role not in ('Captain','Co-captain') then raise exception 'Choose Captain or Co-captain.'; end if;
  if not exists(select 1 from public.conference_player_pool pool where pool.conference_id=v_conference_id and pool.player_id=p_player_id) then
    raise exception 'Choose a player from this conference directory.';
  end if;
  select registration.team_id into v_existing_team_id from public.registrations registration
  where registration.player_id=p_player_id and registration.season_id=v_season_id;
  if v_existing_team_id is not null and v_existing_team_id<>p_team_id then
    raise exception 'This player is already assigned to another team in this season.';
  end if;
  if exists(select 1 from public.registrations registration where registration.player_id=p_player_id and registration.season_id=v_season_id and registration.role_label in ('Captain','Co-captain') and registration.role_label<>p_role) then
    raise exception 'The same player cannot hold both leader roles.';
  end if;
  update public.registrations set role_label='Player'
  where team_id=p_team_id and role_label=p_role and player_id<>p_player_id;
  insert into public.registrations(player_id,season_id,team_id,status,role_label)
  values(p_player_id,v_season_id,p_team_id,'active',p_role)
  on conflict(player_id,season_id) do update set team_id=excluded.team_id,status='active',role_label=excluded.role_label
  returning id into v_registration_id;
  insert into public.activity_log(conference_id,actor_profile_id,action,entity_type,entity_id,summary)
  values(v_conference_id,(select auth.uid()),'update','team_leadership',p_team_id::text,'Assigned '||p_role||' from the player directory');
  return v_registration_id;
end;
$$;

revoke all on function public.owner_create_divisions(uuid,text[]) from public;
revoke all on function public.owner_create_teams(uuid,text[]) from public;
revoke all on function public.owner_assign_directory_leader(uuid,uuid,text) from public;
grant execute on function public.owner_create_divisions(uuid,text[]) to authenticated;
grant execute on function public.owner_create_teams(uuid,text[]) to authenticated;
grant execute on function public.owner_assign_directory_leader(uuid,uuid,text) to authenticated;
