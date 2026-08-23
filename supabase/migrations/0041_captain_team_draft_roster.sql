-- Captains need to see every player they draft, while ordinary players must
-- continue to see only their own registration. This narrow RPC keeps that
-- roster view scoped to the captain's own team.
create or replace function public.captain_team_draft_roster(p_team_id uuid)
returns table(
  registration_id uuid,
  public_player_id text,
  display_name text,
  jersey_number integer,
  player_position text,
  role_label text,
  uniform_size text
)
language plpgsql security definer set search_path=''
as $$
begin
  if not exists(
    select 1
    from public.registrations registration
    join public.player_profiles player on player.id=registration.player_id
    where registration.team_id=p_team_id
      and player.profile_id=(select auth.uid())
      and registration.role_label in ('Captain','Co-captain')
  ) then raise exception 'Captain access is required for this team.'; end if;

  return query
  select registration.id,player.public_player_id,player.display_name,
    registration.jersey_number,registration.position,registration.role_label,
    player.preferred_uniform_size
  from public.registrations registration
  join public.player_profiles player on player.id=registration.player_id
  where registration.team_id=p_team_id and registration.status<>'inactive'
  order by case when registration.role_label='Captain' then 0 when registration.role_label='Co-captain' then 1 else 2 end,
    registration.jersey_number nulls last,player.display_name;
end;
$$;

revoke all on function public.captain_team_draft_roster(uuid) from public;
grant execute on function public.captain_team_draft_roster(uuid) to authenticated;
