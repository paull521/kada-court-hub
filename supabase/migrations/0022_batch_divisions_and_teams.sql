-- Mobile-friendly batch creation for setup Steps 2 and 3.

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
begin
  select season.conference_id,season.setup_stage into v_conference_id,v_stage
  from public.seasons season where season.id=p_season_id;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then
    raise exception 'Only this conference owner can create divisions.';
  end if;
  if v_stage<>1 then raise exception 'Division setup is already complete.'; end if;
  if coalesce(array_length(p_names,1),0)<1 or array_length(p_names,1)>20 then
    raise exception 'Choose from 1 to 20 divisions.';
  end if;
  if exists(select 1 from unnest(p_names) division_name where nullif(trim(division_name),'') is null or char_length(trim(division_name))>80) then
    raise exception 'Enter every division name using up to 80 characters.';
  end if;
  insert into public.divisions(season_id,name)
  select p_season_id,clean_name
  from (select distinct trim(division_name) clean_name from unnest(p_names) division_name) names
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
  from public.divisions division
  join public.seasons season on season.id=division.season_id
  where division.id=p_division_id;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then
    raise exception 'Only this conference owner can create teams.';
  end if;
  if v_stage<>2 then raise exception 'Team setup is not currently open.'; end if;
  if coalesce(array_length(p_names,1),0)<1 or array_length(p_names,1)>30 then
    raise exception 'Choose from 1 to 30 teams for this division.';
  end if;
  if exists(select 1 from unnest(p_names) team_name where nullif(trim(team_name),'') is null or char_length(trim(team_name))>80) then
    raise exception 'Enter every team name using up to 80 characters.';
  end if;
  insert into public.teams(division_id,name,active)
  select p_division_id,clean_name,true
  from (select distinct trim(team_name) clean_name from unnest(p_names) team_name) names
  on conflict(division_id,name) do update set active=true;
  get diagnostics v_count=row_count;
  insert into public.activity_log(conference_id,actor_profile_id,action,entity_type,entity_id,summary)
  values(v_conference_id,(select auth.uid()),'create','teams',p_division_id::text,'Saved '||v_count||' teams');
  return v_count;
end;
$$;

revoke all on function public.owner_create_divisions(uuid,text[]) from public;
revoke all on function public.owner_create_teams(uuid,text[]) from public;
grant execute on function public.owner_create_divisions(uuid,text[]) to authenticated;
grant execute on function public.owner_create_teams(uuid,text[]) to authenticated;
