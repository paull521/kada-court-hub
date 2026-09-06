-- Allow a conference owner to place a teamless Player registration on an
-- active team in the same division. This covers both invitation-based players
-- and legacy/demo players returned to the draft pool.
create or replace function public.owner_assign_unassigned_player(
  p_registration_id uuid,
  p_team_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conference_id uuid;
  v_division_id uuid;
  v_target_division_id uuid;
begin
  select season.conference_id, registration.division_id
    into v_conference_id, v_division_id
  from public.registrations registration
  join public.seasons season on season.id = registration.season_id
  where registration.id = p_registration_id
    and registration.team_id is null
    and registration.role_label = 'Player'
    and registration.status in ('active', 'pending')
    and season.canceled_at is null;

  if v_conference_id is null
    or not public.user_has_conference_role(
      v_conference_id,
      array['owner']::public.conference_role[]
    ) then
    raise exception 'Choose an unassigned player in your conference.';
  end if;

  select team.division_id into v_target_division_id
  from public.teams team
  where team.id = p_team_id
    and team.active;

  if v_target_division_id is null or v_target_division_id is distinct from v_division_id then
    raise exception 'Choose an active team in the player''s division.';
  end if;

  update public.registrations
  set team_id = p_team_id,
      status = 'pending'
  where id = p_registration_id;

  insert into public.activity_log(
    conference_id,
    actor_profile_id,
    action,
    entity_type,
    entity_id,
    summary
  )
  values(
    v_conference_id,
    (select auth.uid()),
    'owner_override',
    'unassigned_player_assignment',
    p_registration_id::text,
    'Assigned an unassigned player to a team.'
  );
end;
$$;

revoke all on function public.owner_assign_unassigned_player(uuid, uuid) from public;
grant execute on function public.owner_assign_unassigned_player(uuid, uuid) to authenticated;
