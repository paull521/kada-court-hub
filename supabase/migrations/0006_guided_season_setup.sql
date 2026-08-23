-- Persistent, guided owner setup: Season -> Division -> Teams -> Players -> Leadership.
-- Safe to run after 0001 through 0005.

alter table public.seasons add column if not exists setup_stage smallint not null default 1;
alter table public.seasons drop constraint if exists seasons_setup_stage_check;
alter table public.seasons add constraint seasons_setup_stage_check check (setup_stage between 1 and 5);

-- Infer a sensible starting point for seasons created before this guided workflow.
update public.seasons season
set setup_stage = case
  when exists (
    select 1 from public.registrations registration
    where registration.season_id = season.id and registration.status = 'active' and registration.role_label = 'Captain'
  ) then 5
  when exists (
    select 1 from public.registrations registration
    where registration.season_id = season.id and registration.status = 'active'
  ) then 4
  when exists (
    select 1 from public.teams team join public.divisions division on division.id = team.division_id
    where division.season_id = season.id
  ) then 3
  when exists (select 1 from public.divisions division where division.season_id = season.id) then 2
  else 1
end;

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
  v_setup_stage smallint := 1;
begin
  if not public.user_has_conference_role(p_conference_id, array['owner']::public.conference_role[]) then
    raise exception 'Only a conference owner can create a season.';
  end if;
  if v_name is null or char_length(v_name) > 80 then raise exception 'Enter a valid season name.'; end if;
  if p_ends_on < p_starts_on then raise exception 'The season end date must be after its start date.'; end if;
  if v_division_name is not null then v_setup_stage := 2; end if;

  insert into public.seasons (conference_id, name, starts_on, ends_on, registration_open, setup_stage)
  values (p_conference_id, v_name, p_starts_on, p_ends_on, p_registration_open, v_setup_stage)
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

create or replace function public.owner_advance_season_setup(p_season_id uuid, p_expected_stage integer)
returns smallint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conference_id uuid;
  v_current_stage smallint;
  v_active_players integer;
begin
  select conference_id, setup_stage into v_conference_id, v_current_stage
  from public.seasons where id = p_season_id for update;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id, array['owner']::public.conference_role[]) then
    raise exception 'Only a conference owner can advance season setup.';
  end if;
  if v_current_stage <> p_expected_stage then raise exception 'This setup step was already completed. Refresh the page.'; end if;
  if v_current_stage >= 5 then return v_current_stage; end if;

  if v_current_stage = 1 and not exists (select 1 from public.divisions where season_id = p_season_id) then
    raise exception 'Add at least one division before continuing.';
  elsif v_current_stage = 2 and not exists (
    select 1 from public.teams team join public.divisions division on division.id = team.division_id
    where division.season_id = p_season_id
  ) then raise exception 'Add at least one team before continuing.';
  elsif v_current_stage = 3 and not exists (
    select 1 from public.registrations where season_id = p_season_id and status = 'active'
  ) then raise exception 'Add at least one active player before continuing.';
  elsif v_current_stage = 4 then
    select count(*) into v_active_players from public.registrations where season_id = p_season_id and status = 'active';
    if not exists (
      select 1 from public.registrations where season_id = p_season_id and status = 'active' and role_label = 'Captain'
    ) then raise exception 'Assign at least one captain before finishing.'; end if;
    if v_active_players >= 2 and not exists (
      select 1 from public.registrations where season_id = p_season_id and status = 'active' and role_label = 'Co-captain'
    ) then raise exception 'Assign at least one co-captain before finishing.'; end if;
  end if;

  update public.seasons set setup_stage = setup_stage + 1 where id = p_season_id returning setup_stage into v_current_stage;
  insert into public.activity_log (conference_id, actor_profile_id, action, entity_type, entity_id, summary)
  values (v_conference_id, (select auth.uid()), 'update', 'season_setup', p_season_id::text, 'Advanced guided setup to step ' || v_current_stage);
  return v_current_stage;
end;
$$;

revoke all on function public.owner_advance_season_setup(uuid,integer) from public;
grant execute on function public.owner_advance_season_setup(uuid,integer) to authenticated;
