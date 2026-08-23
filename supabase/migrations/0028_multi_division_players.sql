-- A player may join and pay for more than one division in the same season.

alter table public.registrations add column if not exists division_id uuid references public.divisions(id) on delete cascade;
update public.registrations registration set division_id=team.division_id from public.teams team where registration.team_id=team.id and registration.division_id is null;
alter table public.registrations drop constraint if exists registrations_player_id_season_id_key;
create unique index if not exists registrations_player_season_division_key on public.registrations(player_id,season_id,division_id) where division_id is not null;

do $$
declare invitation record;v_registration_id uuid;v_current_division uuid;
begin
  for invitation in select id,registration_id,player_id,season_id,division_id,response from public.season_invitations where division_id is not null order by created_at,id loop
    select id into v_registration_id from public.registrations where player_id=invitation.player_id and season_id=invitation.season_id and division_id=invitation.division_id limit 1;
    if v_registration_id is null and invitation.registration_id is not null then
      select division_id into v_current_division from public.registrations where id=invitation.registration_id;
      if v_current_division is null then
        update public.registrations set division_id=invitation.division_id where id=invitation.registration_id returning id into v_registration_id;
      end if;
    end if;
    if v_registration_id is null and invitation.response='joining' then
      insert into public.registrations(player_id,season_id,division_id,team_id,status,role_label)
      values(invitation.player_id,invitation.season_id,invitation.division_id,null,'pending','Player') returning id into v_registration_id;
    end if;
    update public.season_invitations set registration_id=v_registration_id where id=invitation.id;
  end loop;
end;
$$;

create or replace function public.respond_to_season_invitation(p_invitation_id uuid,p_response text)
returns void language plpgsql security definer set search_path=''
as $$
declare v_registration_id uuid;v_profile_id uuid;v_player_id uuid;v_season_id uuid;v_division_id uuid;v_capacity integer;v_eligible integer;v_selection text;
begin
  if p_response not in ('joining','not_joining') then raise exception 'Choose Joining or Not Joining.'; end if;
  select invitation.registration_id,invitation.player_id,invitation.season_id,invitation.division_id,player.profile_id,broadcast.team_count*broadcast.players_per_team
  into v_registration_id,v_player_id,v_season_id,v_division_id,v_profile_id,v_capacity
  from public.season_invitations invitation join public.player_profiles player on player.id=invitation.player_id join public.season_broadcasts broadcast on broadcast.id=invitation.broadcast_id where invitation.id=p_invitation_id;
  if v_profile_id is null or v_profile_id<>(select auth.uid()) then raise exception 'This invitation does not belong to the signed-in player.'; end if;
  if exists(select 1 from public.season_invitations invitation join public.season_broadcasts broadcast on broadcast.id=invitation.broadcast_id where invitation.id=p_invitation_id and broadcast.response_deadline<current_date) then raise exception 'The response deadline has passed.'; end if;
  if p_response='joining' then
    select count(*) into v_eligible from public.season_invitations invitation where invitation.division_id=v_division_id and invitation.selection_status='eligible' and invitation.id<>p_invitation_id;
    v_selection:=case when v_eligible<coalesce(v_capacity,0) then 'eligible' else 'waitlisted' end;
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

create or replace function public.owner_assign_directory_leader(p_team_id uuid,p_player_id uuid,p_role text)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_conference_id uuid;v_season_id uuid;v_division_id uuid;v_registration_id uuid;v_existing_team_id uuid;
begin
  select season.conference_id,season.id,division.id into v_conference_id,v_season_id,v_division_id from public.teams team join public.divisions division on division.id=team.division_id join public.seasons season on season.id=division.season_id where team.id=p_team_id;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then raise exception 'Only this conference owner can assign team leaders.'; end if;
  if p_role not in ('Captain','Co-captain') then raise exception 'Choose Captain or Co-captain.'; end if;
  if not exists(select 1 from public.conference_player_pool pool where pool.conference_id=v_conference_id and pool.player_id=p_player_id) then raise exception 'Choose a player from this conference directory.'; end if;
  select team_id into v_existing_team_id from public.registrations where player_id=p_player_id and season_id=v_season_id and division_id=v_division_id;
  if v_existing_team_id is not null and v_existing_team_id<>p_team_id then raise exception 'This player is already assigned to another team in this division.'; end if;
  update public.registrations set role_label='Player' where team_id=p_team_id and role_label=p_role and player_id<>p_player_id;
  insert into public.registrations(player_id,season_id,division_id,team_id,status,role_label)
  values(p_player_id,v_season_id,v_division_id,p_team_id,'active',p_role)
  on conflict(player_id,season_id,division_id) where division_id is not null do update set team_id=excluded.team_id,status='active',role_label=excluded.role_label
  returning id into v_registration_id;
  return v_registration_id;
end;
$$;

create or replace function public.captain_save_draft_player(p_team_id uuid,p_invitation_id uuid,p_jersey_number integer default null,p_position text default null)
returns void language plpgsql security definer set search_path=''
as $$
declare v_division_id uuid;v_registration_id uuid;v_status text;v_position text:=nullif(trim(p_position),'');
begin
  select team.division_id into v_division_id from public.teams team where team.id=p_team_id;
  if v_division_id is null or not exists(select 1 from public.registrations registration join public.player_profiles player on player.id=registration.player_id where registration.team_id=p_team_id and player.profile_id=(select auth.uid()) and registration.role_label in ('Captain','Co-captain')) then raise exception 'Captain access is required for this team.'; end if;
  select coalesce(draft.status,'editing') into v_status from public.teams team left join public.team_roster_drafts draft on draft.team_id=team.id where team.id=p_team_id;
  if v_status in ('submitted','approved') then raise exception 'This roster is locked while it is under owner review.'; end if;
  select invitation.registration_id into v_registration_id from public.season_invitations invitation where invitation.id=p_invitation_id and invitation.division_id=v_division_id and invitation.response='joining' and invitation.selection_status in ('eligible','waitlisted');
  if v_registration_id is null then raise exception 'Choose a player from this division draft list.'; end if;
  if p_jersey_number is not null and (p_jersey_number<0 or p_jersey_number>99) then raise exception 'Jersey number must be from 0 to 99.'; end if;
  if p_jersey_number is not null and exists(select 1 from public.registrations where team_id=p_team_id and jersey_number=p_jersey_number and id<>v_registration_id) then raise exception 'That jersey number is already used on this team.'; end if;
  update public.registrations set team_id=p_team_id,division_id=v_division_id,jersey_number=p_jersey_number,position=v_position,status='pending' where id=v_registration_id;
  insert into public.team_roster_drafts(team_id,status,updated_at) values(p_team_id,'editing',now()) on conflict(team_id) do update set status='editing',submitted_at=null,submitted_by=null,reviewed_at=null,reviewed_by=null,owner_note=null,updated_at=now();
end;
$$;

revoke all on function public.respond_to_season_invitation(uuid,text) from public;
revoke all on function public.owner_assign_directory_leader(uuid,uuid,text) from public;
revoke all on function public.captain_save_draft_player(uuid,uuid,integer,text) from public;
grant execute on function public.respond_to_season_invitation(uuid,text) to authenticated;
grant execute on function public.owner_assign_directory_leader(uuid,uuid,text) to authenticated;
grant execute on function public.captain_save_draft_player(uuid,uuid,integer,text) to authenticated;

