-- Owner roster overrides are explicitly audited. Captains can update only their
-- own jersey number and position while their roster is still editable.

create or replace function public.owner_assign_draft_player(
  p_invitation_id uuid,
  p_team_id uuid,
  p_jersey_number integer default null,
  p_position text default null
)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_conference_id uuid; v_season_id uuid; v_division_id uuid; v_registration_id uuid; v_player_id uuid;
  v_player_name text; v_team_name text; v_position text:=nullif(trim(p_position),'');
begin
  select invitation.season_id,invitation.division_id,invitation.registration_id,invitation.player_id,season.conference_id,player.display_name
  into v_season_id,v_division_id,v_registration_id,v_player_id,v_conference_id,v_player_name
  from public.season_invitations invitation
  join public.seasons season on season.id=invitation.season_id
  join public.player_profiles player on player.id=invitation.player_id
  where invitation.id=p_invitation_id and invitation.response='joining' and invitation.selection_status='eligible';
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then raise exception 'Choose an eligible draft-pool player.'; end if;
  if exists(select 1 from public.season_broadcasts where division_id=v_division_id and broadcast_type='roster_final') then raise exception 'The final roster is published and cannot be changed.'; end if;
  select name into v_team_name from public.teams where id=p_team_id and division_id=v_division_id;
  if v_team_name is null then raise exception 'Choose a team in this division.'; end if;
  if p_jersey_number is not null and (p_jersey_number<0 or p_jersey_number>99) then raise exception 'Jersey number must be from 0 to 99.'; end if;
  if v_position is not null and char_length(v_position)>40 then raise exception 'Enter a shorter position.'; end if;
  if p_jersey_number is not null and exists(select 1 from public.registrations where team_id=p_team_id and jersey_number=p_jersey_number and id<>v_registration_id) then raise exception 'That jersey number is already assigned on this team.'; end if;
  update public.registrations set team_id=p_team_id,jersey_number=p_jersey_number,position=v_position,status='pending' where id=v_registration_id;
  update public.season_invitations set selection_status='waitlisted' where season_id=v_season_id and player_id=v_player_id and id<>p_invitation_id and selection_status='eligible';
  insert into public.activity_log(conference_id,actor_profile_id,action,entity_type,entity_id,summary)
  values(v_conference_id,(select auth.uid()),'owner_override','draft_assignment',p_invitation_id::text,'Owner assigned '||coalesce(v_player_name,'a player')||' to '||v_team_name);
end;
$$;

create or replace function public.update_own_captain_team_details(
  p_registration_id uuid,
  p_jersey_number integer,
  p_position text default null
)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_team_id uuid; v_division_id uuid; v_conference_id uuid; v_position text:=nullif(trim(p_position),'');
begin
  select registration.team_id,team.division_id,season.conference_id
  into v_team_id,v_division_id,v_conference_id
  from public.registrations registration
  join public.player_profiles player on player.id=registration.player_id
  join public.teams team on team.id=registration.team_id
  join public.divisions division on division.id=team.division_id
  join public.seasons season on season.id=division.season_id
  where registration.id=p_registration_id and player.profile_id=(select auth.uid())
    and registration.role_label in ('Captain','Co-captain') and registration.status in ('active','pending');
  if v_team_id is null then raise exception 'Only your active captain registration can be updated.'; end if;
  if exists(select 1 from public.season_broadcasts where division_id=v_division_id and broadcast_type='roster_final') then raise exception 'The final roster is published. Ask your owner to make a roster change.'; end if;
  if p_jersey_number is not null and (p_jersey_number<0 or p_jersey_number>99) then raise exception 'Jersey number must be from 0 to 99.'; end if;
  if v_position is not null and char_length(v_position)>40 then raise exception 'Enter a shorter position.'; end if;
  if p_jersey_number is not null and exists(select 1 from public.registrations where team_id=v_team_id and jersey_number=p_jersey_number and id<>p_registration_id) then raise exception 'That jersey number is already assigned on this team.'; end if;
  update public.registrations set jersey_number=p_jersey_number,position=v_position where id=p_registration_id;
  insert into public.activity_log(conference_id,actor_profile_id,action,entity_type,entity_id,summary)
  values(v_conference_id,(select auth.uid()),'update','captain_self_details',p_registration_id::text,'Captain updated their own jersey number or position');
end;
$$;

revoke all on function public.owner_assign_draft_player(uuid,uuid,integer,text) from public;
grant execute on function public.owner_assign_draft_player(uuid,uuid,integer,text) to authenticated;
revoke all on function public.update_own_captain_team_details(uuid,integer,text) from public;
grant execute on function public.update_own_captain_team_details(uuid,integer,text) to authenticated;

create or replace function public.join_division_from_link(p_division_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_player_id uuid; v_conference_id uuid; v_season_id uuid; v_broadcast_id uuid; v_invitation_id uuid;
begin
  select id into v_player_id from public.player_profiles where profile_id=(select auth.uid());
  if v_player_id is null then raise exception 'Create a KCH profile before joining.'; end if;
  select season.conference_id,season.id into v_conference_id,v_season_id from public.divisions division join public.seasons season on season.id=division.season_id where division.id=p_division_id;
  if v_conference_id is null then raise exception 'This division link is not valid.'; end if;
  if exists(select 1 from public.season_broadcasts where division_id=p_division_id and broadcast_type='roster_final') then raise exception 'This division roster is already final.'; end if;
  select id into v_broadcast_id from public.season_broadcasts where division_id=p_division_id and broadcast_type='player_invitation' and response_deadline>=current_date order by created_at desc limit 1;
  if v_broadcast_id is null then raise exception 'This division is not accepting player responses right now.'; end if;
  insert into public.conference_player_pool(conference_id,player_id) values(v_conference_id,v_player_id) on conflict do nothing;
  insert into public.season_invitations(broadcast_id,season_id,division_id,player_id,registration_id,response,selection_status)
  values(v_broadcast_id,v_season_id,p_division_id,v_player_id,null,'pending','awaiting_response')
  on conflict(season_id,division_id,player_id) do update set broadcast_id=excluded.broadcast_id,response='pending',selection_status='awaiting_response',responded_at=null
  returning id into v_invitation_id;
  perform public.respond_to_season_invitation(v_invitation_id,'joining');
end;
$$;
revoke all on function public.join_division_from_link(uuid) from public;
grant execute on function public.join_division_from_link(uuid) to authenticated;
