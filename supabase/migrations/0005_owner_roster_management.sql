-- Owner roster management.
-- Safe to run after 0001 through 0004.

create or replace function public.owner_add_roster_player(
  p_team_id uuid,
  p_display_name text,
  p_email text default null,
  p_mobile text default null,
  p_jersey_number integer default null,
  p_position text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conference_id uuid;
  v_season_id uuid;
  v_player_id uuid;
  v_registration_id uuid;
  v_name text := nullif(trim(p_display_name), '');
  v_email text := nullif(lower(trim(p_email)), '');
  v_mobile text := nullif(trim(p_mobile), '');
  v_position text := nullif(trim(p_position), '');
begin
  select season.id, season.conference_id into v_season_id, v_conference_id
  from public.teams team
  join public.divisions division on division.id = team.division_id
  join public.seasons season on season.id = division.season_id
  where team.id = p_team_id;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id, array['owner']::public.conference_role[]) then
    raise exception 'Only a conference owner can add roster players.';
  end if;
  if v_name is null or char_length(v_name) > 100 then raise exception 'Enter a valid player name.'; end if;
  if v_email is not null and (char_length(v_email) > 254 or position('@' in v_email) < 2) then raise exception 'Enter a valid email address.'; end if;
  if v_mobile is not null and char_length(v_mobile) > 40 then raise exception 'Enter a valid mobile number.'; end if;
  if p_jersey_number is not null and (p_jersey_number < 0 or p_jersey_number > 99) then raise exception 'Jersey number must be from 0 to 99.'; end if;
  if v_position is not null and char_length(v_position) > 40 then raise exception 'Enter a shorter position.'; end if;
  if p_jersey_number is not null and exists (
    select 1 from public.registrations where team_id = p_team_id and status = 'active' and jersey_number = p_jersey_number
  ) then raise exception 'That jersey number is already assigned on this team.'; end if;

  insert into public.player_profiles (public_player_id, display_name, email, mobile)
  values ('KCH-ROSTER-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)), v_name, v_email, v_mobile)
  returning id into v_player_id;
  insert into public.registrations (player_id, season_id, team_id, status, jersey_number, position, role_label)
  values (v_player_id, v_season_id, p_team_id, 'active', p_jersey_number, v_position, 'Player')
  returning id into v_registration_id;
  insert into public.activity_log (conference_id, actor_profile_id, action, entity_type, entity_id, summary)
  values (v_conference_id, (select auth.uid()), 'create', 'registration', v_registration_id::text, 'Added ' || v_name || ' to a roster');
  return v_registration_id;
end;
$$;

create or replace function public.owner_add_existing_player(
  p_team_id uuid,
  p_public_player_id text,
  p_jersey_number integer default null,
  p_position text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conference_id uuid;
  v_season_id uuid;
  v_player_id uuid;
  v_profile_id uuid;
  v_registration_id uuid;
  v_public_id text := upper(nullif(trim(p_public_player_id), ''));
  v_position text := nullif(trim(p_position), '');
begin
  select season.id, season.conference_id into v_season_id, v_conference_id
  from public.teams team
  join public.divisions division on division.id = team.division_id
  join public.seasons season on season.id = division.season_id
  where team.id = p_team_id;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id, array['owner']::public.conference_role[]) then
    raise exception 'Only a conference owner can add roster players.';
  end if;
  select id, profile_id into v_player_id, v_profile_id from public.player_profiles where upper(public_player_id) = v_public_id;
  if v_player_id is null then raise exception 'No player was found with that KCH Player ID.'; end if;
  if p_jersey_number is not null and (p_jersey_number < 0 or p_jersey_number > 99) then raise exception 'Jersey number must be from 0 to 99.'; end if;
  if v_position is not null and char_length(v_position) > 40 then raise exception 'Enter a shorter position.'; end if;
  if p_jersey_number is not null and exists (
    select 1 from public.registrations where team_id = p_team_id and status = 'active' and jersey_number = p_jersey_number and player_id <> v_player_id
  ) then raise exception 'That jersey number is already assigned on this team.'; end if;

  insert into public.registrations (player_id, season_id, team_id, status, jersey_number, position, role_label)
  values (v_player_id, v_season_id, p_team_id, 'active', p_jersey_number, v_position, 'Player')
  on conflict (player_id, season_id) do update
    set team_id = excluded.team_id, status = 'active', jersey_number = excluded.jersey_number,
        position = excluded.position, role_label = 'Player'
  returning id into v_registration_id;
  if v_profile_id is not null then
    insert into public.conference_memberships (conference_id, profile_id, role)
    values (v_conference_id, v_profile_id, 'player') on conflict (conference_id, profile_id, role) do nothing;
  end if;
  insert into public.activity_log (conference_id, actor_profile_id, action, entity_type, entity_id, summary)
  values (v_conference_id, (select auth.uid()), 'create', 'registration', v_registration_id::text, 'Added an existing KCH player to a roster');
  return v_registration_id;
end;
$$;

create or replace function public.owner_update_roster_registration(
  p_registration_id uuid,
  p_jersey_number integer default null,
  p_position text default null,
  p_status text default 'active'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conference_id uuid;
  v_team_id uuid;
  v_position text := nullif(trim(p_position), '');
begin
  select season.conference_id, registration.team_id into v_conference_id, v_team_id
  from public.registrations registration
  join public.seasons season on season.id = registration.season_id
  where registration.id = p_registration_id;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id, array['owner']::public.conference_role[]) then
    raise exception 'Only a conference owner can update roster players.';
  end if;
  if p_status not in ('pending', 'active', 'inactive') then raise exception 'Choose a valid roster status.'; end if;
  if p_jersey_number is not null and (p_jersey_number < 0 or p_jersey_number > 99) then raise exception 'Jersey number must be from 0 to 99.'; end if;
  if v_position is not null and char_length(v_position) > 40 then raise exception 'Enter a shorter position.'; end if;
  if p_status = 'active' and p_jersey_number is not null and exists (
    select 1 from public.registrations
    where team_id = v_team_id and status = 'active' and jersey_number = p_jersey_number and id <> p_registration_id
  ) then raise exception 'That jersey number is already assigned on this team.'; end if;

  update public.registrations
  set jersey_number = p_jersey_number, position = v_position,
      status = p_status::public.registration_status,
      role_label = case when p_status = 'active' then role_label else 'Player' end
  where id = p_registration_id;
  insert into public.activity_log (conference_id, actor_profile_id, action, entity_type, entity_id, summary)
  values (v_conference_id, (select auth.uid()), 'update', 'registration', p_registration_id::text, 'Updated a roster registration');
end;
$$;

revoke all on function public.owner_add_roster_player(uuid,text,text,text,integer,text) from public;
revoke all on function public.owner_add_existing_player(uuid,text,integer,text) from public;
revoke all on function public.owner_update_roster_registration(uuid,integer,text,text) from public;
grant execute on function public.owner_add_roster_player(uuid,text,text,text,integer,text) to authenticated;
grant execute on function public.owner_add_existing_player(uuid,text,integer,text) to authenticated;
grant execute on function public.owner_update_roster_registration(uuid,integer,text,text) to authenticated;
