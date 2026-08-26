-- Captains share the same conference invitation link as their commissioner.
-- The link remains scoped to the conference; it does not grant directory access.
create or replace function public.captain_get_conference_player_invitation_token(p_team_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_conference_id uuid; v_token uuid;
begin
  select season.conference_id into v_conference_id
  from public.registrations registration
  join public.player_profiles player on player.id=registration.player_id
  join public.teams team on team.id=registration.team_id
  join public.divisions division on division.id=team.division_id
  join public.seasons season on season.id=division.season_id
  where registration.team_id=p_team_id
    and player.profile_id=(select auth.uid())
    and registration.role_label in ('Captain','Co-captain')
    and registration.status in ('active','pending')
  limit 1;

  if v_conference_id is null then
    raise exception 'Only a captain for this team can access the conference player invitation.';
  end if;

  insert into public.conference_player_invitation_links(conference_id,created_by)
  values(v_conference_id,(select auth.uid())) on conflict(conference_id) do nothing;
  select token into v_token from public.conference_player_invitation_links where conference_id=v_conference_id;
  return v_token;
end;
$$;

revoke all on function public.captain_get_conference_player_invitation_token(uuid) from public;
grant execute on function public.captain_get_conference_player_invitation_token(uuid) to authenticated;
