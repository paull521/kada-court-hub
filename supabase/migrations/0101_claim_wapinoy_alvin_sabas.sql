-- Link Alvin Sabas's real KCH account to his existing WAPinoy / Magenta Ballers roster record.
-- Keeps the existing registration, Captain role, fees, payments, and jersey number intact.
do $$
declare
  v_conference_id uuid;
  v_real_player_id uuid;
  v_real_profile_id uuid;
  v_roster_player_id uuid;
  v_registration_id uuid;
begin
  select id into v_conference_id
  from public.conferences
  where slug = 'wapinoy';

  if v_conference_id is null then
    raise exception 'WAPinoy conference was not found.';
  end if;

  select id, profile_id into v_real_player_id, v_real_profile_id
  from public.player_profiles
  where public_player_id = 'KCH-9E4103D1';

  if v_real_player_id is null or v_real_profile_id is null then
    raise exception 'Alvin Sabas real KCH profile KCH-9E4103D1 was not found.';
  end if;

  select id into v_roster_player_id
  from public.player_profiles
  where public_player_id = 'WAP-MAG-020';

  if v_roster_player_id is null then
    raise exception 'The temporary WAPinoy Alvin Sabas roster record was not found.';
  end if;

  select registration.id into v_registration_id
  from public.registrations registration
  join public.seasons season on season.id = registration.season_id
  join public.divisions division on division.id = registration.division_id
  join public.teams team on team.id = registration.team_id
  where registration.player_id = v_roster_player_id
    and season.conference_id = v_conference_id
    and season.name = 'Cardio Friday Season IV'
    and division.name = '40 Over'
    and team.name = 'Magenta Ballers';

  if v_registration_id is null then
    raise exception 'The WAPinoy Magenta Ballers Captain registration was not found.';
  end if;

  if exists (
    select 1
    from public.registrations registration
    join public.seasons season on season.id = registration.season_id
    join public.divisions division on division.id = registration.division_id
    where registration.player_id = v_real_player_id
      and season.conference_id = v_conference_id
      and season.name = 'Cardio Friday Season IV'
      and division.name = '40 Over'
  ) then
    raise exception 'Alvin Sabas already has a WAPinoy 40 Over registration; no duplicate was created.';
  end if;

  update public.registrations
  set player_id = v_real_player_id
  where id = v_registration_id;

  insert into public.conference_player_pool(conference_id, player_id, status)
  values (v_conference_id, v_real_player_id, 'active')
  on conflict (conference_id, player_id) do update
    set status = 'active', updated_at = now();

  insert into public.conference_memberships(conference_id, profile_id, role)
  values (v_conference_id, v_real_profile_id, 'player')
  on conflict (conference_id, profile_id, role) do nothing;

  delete from public.conference_player_pool
  where conference_id = v_conference_id
    and player_id = v_roster_player_id;

  delete from public.player_profiles
  where id = v_roster_player_id;
end;
$$;
