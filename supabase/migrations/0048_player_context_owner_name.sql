-- Safely provides the conference owner name for each of the signed-in player's team registrations.
create or replace function public.get_player_context_owners()
returns table(registration_id uuid, owner_name text)
language sql
security definer
set search_path = ''
as $$
  select registration.id,
    coalesce((
      select owner_profile.display_name
      from public.conference_memberships owner_membership
      join public.profiles owner_profile on owner_profile.id=owner_membership.profile_id
      where owner_membership.conference_id=season.conference_id
        and owner_membership.role='owner'
      order by owner_membership.created_at
      limit 1
    ),'Conference Owner')
  from public.registrations registration
  join public.player_profiles player on player.id=registration.player_id
  join public.teams team on team.id=registration.team_id
  join public.divisions division on division.id=team.division_id
  join public.seasons season on season.id=division.season_id
  where player.profile_id=(select auth.uid())
    and registration.team_id is not null
    and registration.status in('active','pending');
$$;

revoke all on function public.get_player_context_owners() from public;
grant execute on function public.get_player_context_owners() to authenticated;
