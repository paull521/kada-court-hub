-- Owner season and team management.
-- Safe to run after 0001, 0002, and 0003.

create or replace function public.owner_create_season(
  p_conference_id uuid,
  p_name text,
  p_starts_on date,
  p_ends_on date,
  p_registration_open boolean default false,
  p_initial_division_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_season_id uuid;
  v_name text := nullif(trim(p_name), '');
  v_division_name text := nullif(trim(p_initial_division_name), '');
begin
  if not public.user_has_conference_role(p_conference_id, array['owner']::public.conference_role[]) then
    raise exception 'Only a conference owner can create a season.';
  end if;
  if v_name is null or char_length(v_name) > 80 then raise exception 'Enter a valid season name.'; end if;
  if p_ends_on < p_starts_on then raise exception 'The season end date must be after its start date.'; end if;

  insert into public.seasons (conference_id, name, starts_on, ends_on, registration_open)
  values (p_conference_id, v_name, p_starts_on, p_ends_on, p_registration_open)
  returning id into v_season_id;

  if v_division_name is not null then
    if char_length(v_division_name) > 80 then raise exception 'Enter a valid division name.'; end if;
    insert into public.divisions (season_id, name) values (v_season_id, v_division_name);
  end if;

  insert into public.activity_log (conference_id, actor_profile_id, action, entity_type, entity_id, summary)
  values (p_conference_id, (select auth.uid()), 'create', 'season', v_season_id::text, 'Created season ' || v_name);
  return v_season_id;
end;
$$;

create or replace function public.owner_create_division(p_season_id uuid, p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conference_id uuid;
  v_division_id uuid;
  v_name text := nullif(trim(p_name), '');
begin
  select conference_id into v_conference_id from public.seasons where id = p_season_id;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id, array['owner']::public.conference_role[]) then
    raise exception 'Only a conference owner can create a division.';
  end if;
  if v_name is null or char_length(v_name) > 80 then raise exception 'Enter a valid division name.'; end if;

  insert into public.divisions (season_id, name) values (p_season_id, v_name) returning id into v_division_id;
  insert into public.activity_log (conference_id, actor_profile_id, action, entity_type, entity_id, summary)
  values (v_conference_id, (select auth.uid()), 'create', 'division', v_division_id::text, 'Created division ' || v_name);
  return v_division_id;
end;
$$;

create or replace function public.owner_create_team(p_division_id uuid, p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conference_id uuid;
  v_team_id uuid;
  v_name text := nullif(trim(p_name), '');
begin
  select season.conference_id into v_conference_id
  from public.divisions division join public.seasons season on season.id = division.season_id
  where division.id = p_division_id;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id, array['owner']::public.conference_role[]) then
    raise exception 'Only a conference owner can create a team.';
  end if;
  if v_name is null or char_length(v_name) > 80 then raise exception 'Enter a valid team name.'; end if;

  insert into public.teams (division_id, name) values (p_division_id, v_name) returning id into v_team_id;
  insert into public.activity_log (conference_id, actor_profile_id, action, entity_type, entity_id, summary)
  values (v_conference_id, (select auth.uid()), 'create', 'team', v_team_id::text, 'Created team ' || v_name);
  return v_team_id;
end;
$$;

create or replace function public.owner_update_team(p_team_id uuid, p_name text, p_active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conference_id uuid;
  v_name text := nullif(trim(p_name), '');
begin
  select season.conference_id into v_conference_id
  from public.teams team
  join public.divisions division on division.id = team.division_id
  join public.seasons season on season.id = division.season_id
  where team.id = p_team_id;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id, array['owner']::public.conference_role[]) then
    raise exception 'Only a conference owner can update a team.';
  end if;
  if v_name is null or char_length(v_name) > 80 then raise exception 'Enter a valid team name.'; end if;

  update public.teams set name = v_name, active = p_active where id = p_team_id;
  insert into public.activity_log (conference_id, actor_profile_id, action, entity_type, entity_id, summary)
  values (v_conference_id, (select auth.uid()), 'update', 'team', p_team_id::text, 'Updated team ' || v_name);
end;
$$;

create or replace function public.owner_set_team_leadership(
  p_team_id uuid,
  p_captain_registration_id uuid default null,
  p_co_captain_registration_id uuid default null
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
  from public.teams team
  join public.divisions division on division.id = team.division_id
  join public.seasons season on season.id = division.season_id
  where team.id = p_team_id;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id, array['owner']::public.conference_role[]) then
    raise exception 'Only a conference owner can assign team leadership.';
  end if;
  if p_captain_registration_id is not null and p_captain_registration_id = p_co_captain_registration_id then
    raise exception 'Captain and co-captain must be different players.';
  end if;
  if p_captain_registration_id is not null and not exists (
    select 1 from public.registrations where id = p_captain_registration_id and team_id = p_team_id
  ) then raise exception 'The selected captain is not on this team.'; end if;
  if p_co_captain_registration_id is not null and not exists (
    select 1 from public.registrations where id = p_co_captain_registration_id and team_id = p_team_id
  ) then raise exception 'The selected co-captain is not on this team.'; end if;

  update public.registrations set role_label = 'Player'
  where team_id = p_team_id and role_label in ('Captain', 'Co-captain');
  if p_captain_registration_id is not null then
    update public.registrations set role_label = 'Captain' where id = p_captain_registration_id;
  end if;
  if p_co_captain_registration_id is not null then
    update public.registrations set role_label = 'Co-captain' where id = p_co_captain_registration_id;
  end if;

  insert into public.activity_log (conference_id, actor_profile_id, action, entity_type, entity_id, summary)
  values (v_conference_id, (select auth.uid()), 'update', 'team_leadership', p_team_id::text, 'Updated captain and co-captain assignments');
end;
$$;

revoke all on function public.owner_create_season(uuid,text,date,date,boolean,text) from public;
revoke all on function public.owner_create_division(uuid,text) from public;
revoke all on function public.owner_create_team(uuid,text) from public;
revoke all on function public.owner_update_team(uuid,text,boolean) from public;
revoke all on function public.owner_set_team_leadership(uuid,uuid,uuid) from public;
grant execute on function public.owner_create_season(uuid,text,date,date,boolean,text) to authenticated;
grant execute on function public.owner_create_division(uuid,text) to authenticated;
grant execute on function public.owner_create_team(uuid,text) to authenticated;
grant execute on function public.owner_update_team(uuid,text,boolean) to authenticated;
grant execute on function public.owner_set_team_leadership(uuid,uuid,uuid) to authenticated;
