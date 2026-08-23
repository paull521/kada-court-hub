-- Add a newly registered conference player to an invitation already sent for
-- one division, without resetting or notifying the existing invitees.
create or replace function public.owner_invite_existing_division_player(p_division_id uuid,p_public_player_id text)
returns void language plpgsql security definer set search_path=''
as $$
declare v_conference_id uuid;v_season_id uuid;v_season_name text;v_division_name text;v_broadcast_id uuid;v_message text;v_player_id uuid;v_profile_id uuid;v_invitation_id uuid;
begin
  select season.conference_id,season.id,season.name,division.name into v_conference_id,v_season_id,v_season_name,v_division_name
  from public.divisions division join public.seasons season on season.id=division.season_id where division.id=p_division_id;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then raise exception 'Only this conference owner can invite players.'; end if;
  select id,message into v_broadcast_id,v_message from public.season_broadcasts where division_id=p_division_id and broadcast_type='player_invitation' order by created_at desc limit 1;
  if v_broadcast_id is null then raise exception 'Send this division''s main invitation first.'; end if;
  select player.id,player.profile_id into v_player_id,v_profile_id from public.player_profiles player join public.conference_player_pool pool on pool.player_id=player.id where pool.conference_id=v_conference_id and upper(player.public_player_id)=upper(trim(p_public_player_id));
  if v_player_id is null then raise exception 'That KCH Player ID is not in this conference directory.'; end if;
  if exists(select 1 from public.season_invitations where season_id=v_season_id and division_id=p_division_id and player_id=v_player_id) then raise exception 'This player is already invited to this division.'; end if;
  if exists(select 1 from public.season_invitations where season_id=v_season_id and player_id=v_player_id and response='joining') then raise exception 'This player is already joining another division in this season.'; end if;
  insert into public.season_invitations(broadcast_id,season_id,division_id,player_id,registration_id,response,responded_at) values(v_broadcast_id,v_season_id,p_division_id,v_player_id,null,'pending',null) returning id into v_invitation_id;
  update public.season_broadcasts set invited_count=(select count(*) from public.season_invitations where broadcast_id=v_broadcast_id) where id=v_broadcast_id;
  if v_profile_id is not null then insert into public.notifications(profile_id,notification_type,title,body,link_path,entity_id) values(v_profile_id,'season_invitation',v_season_name||' · '||v_division_name,v_message,'/home',v_invitation_id) on conflict(profile_id,notification_type,entity_id) do update set title=excluded.title,body=excluded.body,link_path=excluded.link_path,read_at=null,created_at=now(); end if;
end;
$$;

revoke all on function public.owner_invite_existing_division_player(uuid,text) from public;
grant execute on function public.owner_invite_existing_division_player(uuid,text) to authenticated;
