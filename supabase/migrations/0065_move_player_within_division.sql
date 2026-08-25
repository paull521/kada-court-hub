-- Commissioner-only direct moves within the same division.
create or replace function public.owner_move_player_between_teams(p_registration_id uuid,p_target_team_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_conference_id uuid;v_source_team_id uuid;v_source_division_id uuid;v_target_division_id uuid;v_role text;v_player_id uuid;
begin
  select season.conference_id,registration.team_id,registration.division_id,registration.role_label,registration.player_id
  into v_conference_id,v_source_team_id,v_source_division_id,v_role,v_player_id
  from public.registrations registration
  join public.seasons season on season.id=registration.season_id
  where registration.id=p_registration_id and registration.status='active' and registration.team_id is not null;

  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then raise exception 'Only this conference commissioner can move this player.'; end if;
  if v_role in ('Captain','Co-captain') then raise exception 'Captains and co-captains cannot be moved with this control.'; end if;

  select division_id into v_target_division_id from public.teams where id=p_target_team_id and active;
  if v_target_division_id is null then raise exception 'Choose an active destination team.'; end if;
  if v_source_division_id is distinct from v_target_division_id then raise exception 'Players can only be moved within the same division.'; end if;
  if v_source_team_id=p_target_team_id then raise exception 'Choose a different team.'; end if;

  update public.registrations set team_id=p_target_team_id where id=p_registration_id;

  insert into public.activity_log(conference_id,actor_profile_id,action,entity_type,entity_id,summary)
  values(v_conference_id,(select auth.uid()),'owner_override','team_move',p_registration_id::text,'Moved player to another team in the same division.');
end;
$$;

grant execute on function public.owner_move_player_between_teams(uuid,uuid) to authenticated;
