-- A preferred position belongs to the player profile. A captain may still set
-- a different roster position for a specific team or division.
alter table public.player_profiles add column if not exists preferred_position text;
alter table public.player_profiles drop constraint if exists player_profiles_preferred_position_check;
alter table public.player_profiles add constraint player_profiles_preferred_position_check check (preferred_position is null or preferred_position in ('G','SG','PG','F','PF','C'));

drop function if exists public.update_own_player_profile(text,text,date,text);
create function public.update_own_player_profile(p_mobile text,p_email text,p_birthdate date,p_location text,p_preferred_position text default null)
returns void language plpgsql security invoker set search_path='' as $$
declare v_position text:=nullif(upper(trim(p_preferred_position)), '');
begin
  if nullif(trim(p_email),'') is null or char_length(trim(p_email))>254 or trim(p_email)!~'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Enter a valid email address.'; end if;
  if v_position is not null and v_position not in ('G','SG','PG','F','PF','C') then raise exception 'Choose a listed preferred position.'; end if;
  update public.profiles set mobile=nullif(trim(p_mobile),''),birthdate=p_birthdate,location=nullif(trim(p_location),'') where id=(select auth.uid());
  update public.player_profiles set email=lower(trim(p_email)),preferred_position=v_position where profile_id=(select auth.uid());
end;
$$;
grant execute on function public.update_own_player_profile(text,text,date,text,text) to authenticated;

create or replace function public.respond_to_season_invitation(p_invitation_id uuid,p_response text)
returns void language plpgsql security definer set search_path='' as $$
declare v_registration_id uuid;v_profile_id uuid;v_player_id uuid;v_season_id uuid;v_division_id uuid;v_capacity integer;v_eligible integer;v_selection text;v_position text;
begin
  if p_response not in ('joining','not_joining') then raise exception 'Choose Joining or Not Joining.'; end if;
  select invitation.registration_id,invitation.player_id,invitation.season_id,invitation.division_id,player.profile_id,broadcast.team_count*broadcast.players_per_team,player.preferred_position
  into v_registration_id,v_player_id,v_season_id,v_division_id,v_profile_id,v_capacity,v_position
  from public.season_invitations invitation join public.player_profiles player on player.id=invitation.player_id join public.season_broadcasts broadcast on broadcast.id=invitation.broadcast_id where invitation.id=p_invitation_id;
  if v_profile_id is null or v_profile_id<>(select auth.uid()) then raise exception 'This invitation does not belong to the signed-in player.'; end if;
  if exists(select 1 from public.season_invitations invitation join public.season_broadcasts broadcast on broadcast.id=invitation.broadcast_id where invitation.id=p_invitation_id and broadcast.response_deadline<current_date) then raise exception 'The response deadline has passed.'; end if;
  if p_response='joining' then
    select count(*) into v_eligible from public.season_invitations invitation where invitation.division_id=v_division_id and invitation.selection_status='eligible' and invitation.id<>p_invitation_id;
    v_selection:=case when v_eligible<coalesce(v_capacity,0) then 'eligible' else 'waitlisted' end;
    insert into public.registrations(player_id,season_id,division_id,team_id,status,role_label,position) values(v_player_id,v_season_id,v_division_id,null,'pending','Player',v_position)
    on conflict(player_id,season_id,division_id) where division_id is not null do update set status='pending',position=coalesce(public.registrations.position,excluded.position)
    returning id into v_registration_id;
  else
    v_selection:='declined';
    if v_registration_id is not null then update public.registrations set status='inactive' where id=v_registration_id and team_id is null; end if;
  end if;
  update public.season_invitations set response=p_response,selection_status=v_selection,responded_at=now(),registration_id=v_registration_id where id=p_invitation_id;
  update public.notifications set read_at=now() where profile_id=(select auth.uid()) and notification_type='season_invitation' and entity_id=p_invitation_id;
end;
$$;
grant execute on function public.respond_to_season_invitation(uuid,text) to authenticated;

drop function if exists public.captain_draft_candidates(uuid);
create function public.captain_draft_candidates(p_team_id uuid)
returns table(invitation_id uuid,registration_id uuid,public_player_id text,display_name text,selection_status text,preferred_position text)
language plpgsql security definer set search_path='' as $$
declare v_division_id uuid;
begin
  select team.division_id into v_division_id from public.teams team where team.id=p_team_id;
  if v_division_id is null or not exists(select 1 from public.registrations registration join public.player_profiles player on player.id=registration.player_id where registration.team_id=p_team_id and player.profile_id=(select auth.uid()) and registration.role_label in ('Captain','Co-captain')) then raise exception 'Captain access is required for this team.'; end if;
  return query select invitation.id,invitation.registration_id,player.public_player_id,player.display_name,invitation.selection_status,player.preferred_position
  from public.season_invitations invitation join public.player_profiles player on player.id=invitation.player_id join public.registrations registration on registration.id=invitation.registration_id
  where invitation.division_id=v_division_id and invitation.response='joining' and invitation.selection_status in ('eligible','waitlisted') and registration.team_id is null
  order by case invitation.selection_status when 'eligible' then 0 else 1 end,invitation.responded_at,player.display_name;
end;
$$;
grant execute on function public.captain_draft_candidates(uuid) to authenticated;
