-- Merge the temporary WAPinoy Alvin record into the real KCH account.
-- The real account already has the Magenta Ballers registration, so its row is retained.
do $$
declare
  v_conference_id uuid;
  v_real_player_id uuid;
  v_real_profile_id uuid;
  v_temporary_player_id uuid;
  v_real_registration_id uuid;
  v_temporary_registration_id uuid;
  v_team_id uuid;
  v_jersey_number integer;
  v_position text;
  v_status public.registration_status;
begin
  select id into v_conference_id from public.conferences where slug = 'wapinoy';
  if v_conference_id is null then raise exception 'WAPinoy conference was not found.'; end if;

  select id, profile_id into v_real_player_id, v_real_profile_id
  from public.player_profiles where public_player_id = 'KCH-9E4103D1';
  if v_real_player_id is null or v_real_profile_id is null then
    raise exception 'Alvin Sabas real KCH profile KCH-9E4103D1 was not found.';
  end if;

  select id into v_temporary_player_id
  from public.player_profiles where public_player_id = 'WAP-MAG-020';
  if v_temporary_player_id is null then
    raise exception 'The temporary WAPinoy Alvin Sabas roster record was not found.';
  end if;

  select registration.id into v_real_registration_id
  from public.registrations registration
  join public.seasons season on season.id = registration.season_id
  join public.divisions division on division.id = registration.division_id
  join public.teams team on team.id = registration.team_id
  where registration.player_id = v_real_player_id
    and season.conference_id = v_conference_id
    and season.name = 'Cardio Friday Season IV'
    and division.name = '40 Over'
    and team.name = 'Magenta Ballers';

  select registration.id, registration.team_id, registration.jersey_number, registration.position, registration.status
    into v_temporary_registration_id, v_team_id, v_jersey_number, v_position, v_status
  from public.registrations registration
  join public.seasons season on season.id = registration.season_id
  join public.divisions division on division.id = registration.division_id
  join public.teams team on team.id = registration.team_id
  where registration.player_id = v_temporary_player_id
    and season.conference_id = v_conference_id
    and season.name = 'Cardio Friday Season IV'
    and division.name = '40 Over'
    and team.name = 'Magenta Ballers';

  if v_real_registration_id is null or v_temporary_registration_id is null then
    raise exception 'Both Alvin Sabas Magenta Ballers registrations are required for this merge.';
  end if;

  -- Preserve the real sign-in account and the temporary roster record's team details.
  update public.registrations
  set team_id = v_team_id,
      jersey_number = v_jersey_number,
      position = coalesce(v_position, position),
      status = v_status,
      role_label = 'Captain'
  where id = v_real_registration_id;

  update public.fees set registration_id = v_real_registration_id
  where registration_id = v_temporary_registration_id;

  update public.payments set registration_id = v_real_registration_id
  where registration_id = v_temporary_registration_id;

  update public.payment_submissions set registration_id = v_real_registration_id
  where registration_id = v_temporary_registration_id;

  update public.registration_waivers set registration_id = v_real_registration_id
  where registration_id = v_temporary_registration_id;

  update public.season_invitations
  set player_id = v_real_player_id, registration_id = v_real_registration_id
  where player_id = v_temporary_player_id
    and registration_id = v_temporary_registration_id;

  update public.roster_change_requests set registration_id = v_real_registration_id
  where registration_id = v_temporary_registration_id;

  insert into public.game_availability(game_id, registration_id, available, updated_at)
  select game_id, v_real_registration_id, available, updated_at
  from public.game_availability
  where registration_id = v_temporary_registration_id
  on conflict (game_id, registration_id) do update
    set available = excluded.available,
        updated_at = excluded.updated_at
    where excluded.updated_at > public.game_availability.updated_at;

  delete from public.game_availability where registration_id = v_temporary_registration_id;
  delete from public.registrations where id = v_temporary_registration_id;

  insert into public.conference_player_pool(conference_id, player_id, status)
  values (v_conference_id, v_real_player_id, 'active')
  on conflict (conference_id, player_id) do update set status = 'active', updated_at = now();

  insert into public.conference_memberships(conference_id, profile_id, role)
  values (v_conference_id, v_real_profile_id, 'player')
  on conflict (conference_id, profile_id, role) do nothing;

  delete from public.conference_player_pool
  where conference_id = v_conference_id and player_id = v_temporary_player_id;
  delete from public.player_profiles where id = v_temporary_player_id;
end;
$$;
