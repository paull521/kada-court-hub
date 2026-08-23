-- Owners choose the exact directory players invited to each division.
create or replace function public.owner_invite_selected_division_players(
  p_division_id uuid,
  p_player_ids uuid[],
  p_message text,
  p_response_deadline date,
  p_players_per_team integer,
  p_flyer_path text default null
)
returns uuid language plpgsql security definer set search_path='' as $$
declare
  v_conference_id uuid; v_season_id uuid; v_season_name text; v_division_name text; v_stage smallint;
  v_message text:=nullif(trim(p_message),''); v_broadcast_id uuid; v_invited_count integer; v_team_count integer;
begin
  select season.conference_id,season.id,season.name,season.setup_stage,division.name
  into v_conference_id,v_season_id,v_season_name,v_stage,v_division_name
  from public.divisions division join public.seasons season on season.id=division.season_id where division.id=p_division_id for update of season;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then raise exception 'Only this conference owner can invite players.'; end if;
  if v_stage not in (4,5) then raise exception 'Complete fees and uniforms before inviting players.'; end if;
  if v_message is null or char_length(v_message)>1000 then raise exception 'Enter an invitation message of 1 to 1000 characters.'; end if;
  if p_response_deadline<current_date then raise exception 'The response deadline cannot be in the past.'; end if;
  if p_players_per_team<1 or p_players_per_team>30 then raise exception 'Players per team must be from 1 to 30.'; end if;
  if cardinality(p_player_ids) is null or cardinality(p_player_ids)<1 then raise exception 'Choose at least one player.'; end if;
  select count(*) into v_team_count from public.teams where division_id=p_division_id and active;
  if v_team_count<1 then raise exception 'Add teams to this division before inviting players.'; end if;
  if exists(select 1 from unnest(p_player_ids) chosen left join public.conference_player_pool pool on pool.conference_id=v_conference_id and pool.player_id=chosen where pool.player_id is null) then raise exception 'Every selected player must be in this conference directory.'; end if;
  insert into public.season_broadcasts(season_id,division_id,message,created_by,broadcast_type,response_deadline,flyer_path,team_count,players_per_team)
  values(v_season_id,p_division_id,v_message,(select auth.uid()),'player_invitation',p_response_deadline,nullif(p_flyer_path,''),v_team_count,p_players_per_team) returning id into v_broadcast_id;
  insert into public.season_invitations(broadcast_id,season_id,division_id,player_id,registration_id,response,responded_at)
  select v_broadcast_id,v_season_id,p_division_id,chosen,null,'pending',null
  from (select distinct unnest(p_player_ids) as chosen) selected
  where not exists(select 1 from public.registrations registration where registration.season_id=v_season_id and registration.player_id=selected.chosen and registration.team_id is not null)
  on conflict(season_id,division_id,player_id) do nothing;
  select count(*) into v_invited_count from public.season_invitations where broadcast_id=v_broadcast_id;
  update public.season_broadcasts set invited_count=v_invited_count where id=v_broadcast_id;
  update public.seasons set players_per_team=p_players_per_team,setup_stage=case when setup_stage<5 then 5 else setup_stage end where id=v_season_id;
  insert into public.notifications(profile_id,notification_type,title,body,link_path,entity_id)
  select player.profile_id,'season_invitation',v_season_name||' · '||v_division_name,v_message,'/home',invitation.id
  from public.season_invitations invitation join public.player_profiles player on player.id=invitation.player_id
  where invitation.broadcast_id=v_broadcast_id and player.profile_id is not null
  on conflict(profile_id,notification_type,entity_id) do update set title=excluded.title,body=excluded.body,link_path=excluded.link_path,read_at=null,created_at=now();
  insert into public.activity_log(conference_id,actor_profile_id,action,entity_type,entity_id,summary)
  values(v_conference_id,(select auth.uid()),'invite','division_invitation',v_broadcast_id::text,'Sent targeted invitations to '||v_invited_count||' player(s) for '||v_division_name);
  return v_broadcast_id;
end;
$$;
revoke all on function public.owner_invite_selected_division_players(uuid,uuid[],text,date,integer,text) from public;
grant execute on function public.owner_invite_selected_division_players(uuid,uuid[],text,date,integer,text) to authenticated;
