-- Let conference owners view the captain roster submissions they must review.

drop policy if exists "Owners and team leaders view roster drafts" on public.team_roster_drafts;
create policy "Owners and team leaders view roster drafts"
on public.team_roster_drafts for select to authenticated
using (
  exists (
    select 1
    from public.teams team
    join public.divisions division on division.id=team.division_id
    join public.seasons season on season.id=division.season_id
    where team.id=team_roster_drafts.team_id
      and public.user_has_conference_role(season.conference_id,array['owner']::public.conference_role[])
  )
  or public.user_manages_team(team_roster_drafts.team_id)
  or exists (
    select 1
    from public.registrations registration
    join public.player_profiles player on player.id=registration.player_id
    where registration.team_id=team_roster_drafts.team_id
      and player.profile_id=(select auth.uid())
      and registration.role_label in ('Captain','Co-captain')
  )
);

