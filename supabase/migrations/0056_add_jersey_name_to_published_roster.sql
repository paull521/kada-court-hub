-- Player roster views need the optional team-specific jersey name.
drop function if exists public.get_published_division_roster(uuid);

create function public.get_published_division_roster(p_division_id uuid)
returns table(registration_id uuid,team_id uuid,team_name text,player_id uuid,player_name text,jersey_number integer,jersey_name text,player_position text,role_label text)
language plpgsql stable security definer set search_path=''
as $$
begin
  if not exists(
    select 1 from public.registrations registration
    join public.player_profiles player on player.id=registration.player_id
    where registration.division_id=p_division_id and registration.status='active' and player.profile_id=(select auth.uid())
  ) then raise exception 'Only a rostered player can view this division roster.'; end if;
  if not exists(select 1 from public.season_broadcasts where division_id=p_division_id and broadcast_type in ('roster_draft','roster_final')) then raise exception 'This division roster has not been shared.'; end if;
  return query
  select registration.id,team.id,team.name,player.id,coalesce(player.display_name,'Unnamed Player'),registration.jersey_number::integer,coalesce(registration.jersey_name,''),coalesce(registration.position,''),registration.role_label
  from public.registrations registration
  join public.teams team on team.id=registration.team_id
  join public.player_profiles player on player.id=registration.player_id
  where registration.division_id=p_division_id and registration.status='active' and team.active
  order by team.name,registration.jersey_number nulls last,player.display_name;
end;
$$;

revoke all on function public.get_published_division_roster(uuid) from public;
grant execute on function public.get_published_division_roster(uuid) to authenticated;
