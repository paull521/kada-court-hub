-- Captains and co-captains are rostered players and consume team capacity.

create or replace function public.respond_to_season_invitation(p_invitation_id uuid,p_response text)
returns void language plpgsql security definer set search_path=''
as $$
declare v_registration_id uuid;v_profile_id uuid;v_player_id uuid;v_season_id uuid;v_division_id uuid;v_capacity integer;v_leaders integer;v_eligible integer;v_selection text;
begin
  if p_response not in ('joining','not_joining') then raise exception 'Choose Joining or Not Joining.'; end if;
  select invitation.registration_id,invitation.player_id,invitation.season_id,invitation.division_id,player.profile_id,broadcast.team_count*broadcast.players_per_team
  into v_registration_id,v_player_id,v_season_id,v_division_id,v_profile_id,v_capacity
  from public.season_invitations invitation join public.player_profiles player on player.id=invitation.player_id join public.season_broadcasts broadcast on broadcast.id=invitation.broadcast_id where invitation.id=p_invitation_id;
  if v_profile_id is null or v_profile_id<>(select auth.uid()) then raise exception 'This invitation does not belong to the signed-in player.'; end if;
  if exists(select 1 from public.season_invitations invitation join public.season_broadcasts broadcast on broadcast.id=invitation.broadcast_id where invitation.id=p_invitation_id and broadcast.response_deadline<current_date) then raise exception 'The response deadline has passed.'; end if;
  select count(*) into v_leaders from public.registrations registration where registration.division_id=v_division_id and registration.team_id is not null and registration.status<>'inactive' and registration.role_label in ('Captain','Co-captain');
  v_capacity:=greatest(0,coalesce(v_capacity,0)-v_leaders);
  if p_response='joining' then
    select count(*) into v_eligible from public.season_invitations invitation where invitation.division_id=v_division_id and invitation.selection_status='eligible' and invitation.id<>p_invitation_id;
    v_selection:=case when v_eligible<v_capacity then 'eligible' else 'waitlisted' end;
    insert into public.registrations(player_id,season_id,division_id,team_id,status,role_label)
    values(v_player_id,v_season_id,v_division_id,null,'pending','Player')
    on conflict(player_id,season_id,division_id) where division_id is not null do update set status='pending'
    returning id into v_registration_id;
  else
    v_selection:='declined';
    if v_registration_id is not null then update public.registrations set status='inactive' where id=v_registration_id and team_id is null; end if;
  end if;
  update public.season_invitations set response=p_response,selection_status=v_selection,responded_at=now(),registration_id=v_registration_id where id=p_invitation_id;
  update public.notifications set read_at=now() where profile_id=(select auth.uid()) and notification_type='season_invitation' and entity_id=p_invitation_id;
end;
$$;

revoke all on function public.respond_to_season_invitation(uuid,text) from public;
grant execute on function public.respond_to_season_invitation(uuid,text) to authenticated;

