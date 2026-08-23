-- Once a captain has added a player to the team, keep that player out of the
-- remaining draft choices. The captain's roster is the source of truth for
-- players already selected.
create or replace function public.captain_draft_candidates(p_team_id uuid)
returns table(invitation_id uuid,registration_id uuid,public_player_id text,display_name text,selection_status text)
language plpgsql security definer set search_path=''
as $$
declare v_division_id uuid;
begin
  select team.division_id into v_division_id from public.teams team where team.id=p_team_id;
  if v_division_id is null or not exists(
    select 1 from public.registrations registration
    join public.player_profiles player on player.id=registration.player_id
    where registration.team_id=p_team_id and player.profile_id=(select auth.uid())
      and registration.role_label in ('Captain','Co-captain')
  ) then raise exception 'Captain access is required for this team.'; end if;

  return query
  select invitation.id,invitation.registration_id,player.public_player_id,player.display_name,invitation.selection_status
  from public.season_invitations invitation
  join public.player_profiles player on player.id=invitation.player_id
  join public.registrations registration on registration.id=invitation.registration_id
  where invitation.division_id=v_division_id and invitation.response='joining'
    and invitation.selection_status in ('eligible','waitlisted')
    and registration.team_id is null
  order by case invitation.selection_status when 'eligible' then 0 else 1 end, invitation.responded_at, player.display_name;
end;
$$;

revoke all on function public.captain_draft_candidates(uuid) from public;
grant execute on function public.captain_draft_candidates(uuid) to authenticated;
