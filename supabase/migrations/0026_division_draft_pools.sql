-- Division response capacity, draft pools, waitlists, and overlap resolution.

alter table public.season_invitations add column if not exists selection_status text not null default 'awaiting_response';
alter table public.season_invitations drop constraint if exists season_invitations_selection_status_check;
alter table public.season_invitations add constraint season_invitations_selection_status_check
  check(selection_status in ('awaiting_response','eligible','waitlisted','declined'));

create or replace function public.respond_to_season_invitation(p_invitation_id uuid,p_response text)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_registration_id uuid;
  v_profile_id uuid;
  v_player_id uuid;
  v_season_id uuid;
  v_division_id uuid;
  v_capacity integer;
  v_eligible integer;
  v_selection text;
begin
  if p_response not in ('joining','not_joining') then raise exception 'Choose Joining or Not Joining.'; end if;
  select invitation.registration_id,invitation.player_id,invitation.season_id,invitation.division_id,player.profile_id,
         broadcast.team_count*broadcast.players_per_team
  into v_registration_id,v_player_id,v_season_id,v_division_id,v_profile_id,v_capacity
  from public.season_invitations invitation
  join public.player_profiles player on player.id=invitation.player_id
  join public.season_broadcasts broadcast on broadcast.id=invitation.broadcast_id
  where invitation.id=p_invitation_id;
  if v_profile_id is null or v_profile_id<>(select auth.uid()) then raise exception 'This invitation does not belong to the signed-in player.'; end if;
  if exists(select 1 from public.season_invitations invitation join public.season_broadcasts broadcast on broadcast.id=invitation.broadcast_id where invitation.id=p_invitation_id and broadcast.response_deadline<current_date) then raise exception 'The response deadline has passed.'; end if;
  if p_response='joining' then
    select count(*) into v_eligible from public.season_invitations invitation
    where invitation.division_id=v_division_id and invitation.selection_status='eligible' and invitation.id<>p_invitation_id;
    v_selection:=case when v_eligible<coalesce(v_capacity,0) then 'eligible' else 'waitlisted' end;
    insert into public.registrations(player_id,season_id,team_id,status,role_label)
    values(v_player_id,v_season_id,null,'pending','Player')
    on conflict(player_id,season_id) do update set status='pending'
    returning id into v_registration_id;
  else
    v_selection:='declined';
    if v_registration_id is not null then update public.registrations set status='inactive' where id=v_registration_id and team_id is null; end if;
  end if;
  update public.season_invitations set response=p_response,selection_status=v_selection,responded_at=now(),registration_id=v_registration_id where id=p_invitation_id;
  update public.notifications set read_at=now() where profile_id=(select auth.uid()) and notification_type='season_invitation' and entity_id=p_invitation_id;
end;
$$;

create or replace function public.owner_assign_draft_player(p_invitation_id uuid,p_team_id uuid,p_jersey_number integer default null,p_position text default null)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_conference_id uuid;v_season_id uuid;v_division_id uuid;v_registration_id uuid;v_player_id uuid;
  v_position text:=nullif(trim(p_position),'');
begin
  select invitation.season_id,invitation.division_id,invitation.registration_id,invitation.player_id,season.conference_id
  into v_season_id,v_division_id,v_registration_id,v_player_id,v_conference_id
  from public.season_invitations invitation join public.seasons season on season.id=invitation.season_id
  where invitation.id=p_invitation_id and invitation.response='joining' and invitation.selection_status='eligible';
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then raise exception 'Choose an eligible draft-pool player.'; end if;
  if not exists(select 1 from public.teams team where team.id=p_team_id and team.division_id=v_division_id) then raise exception 'Choose a team in this division.'; end if;
  if p_jersey_number is not null and (p_jersey_number<0 or p_jersey_number>99) then raise exception 'Jersey number must be from 0 to 99.'; end if;
  if v_position is not null and char_length(v_position)>40 then raise exception 'Enter a shorter position.'; end if;
  if p_jersey_number is not null and exists(select 1 from public.registrations where team_id=p_team_id and jersey_number=p_jersey_number and id<>v_registration_id) then raise exception 'That jersey number is already assigned on this team.'; end if;
  update public.registrations set team_id=p_team_id,jersey_number=p_jersey_number,position=v_position,status='pending' where id=v_registration_id;
  update public.season_invitations set selection_status='waitlisted'
  where season_id=v_season_id and player_id=v_player_id and id<>p_invitation_id and selection_status='eligible';
end;
$$;

revoke all on function public.respond_to_season_invitation(uuid,text) from public;
grant execute on function public.respond_to_season_invitation(uuid,text) to authenticated;
revoke all on function public.owner_assign_draft_player(uuid,uuid,integer,text) from public;
grant execute on function public.owner_assign_draft_player(uuid,uuid,integer,text) to authenticated;
