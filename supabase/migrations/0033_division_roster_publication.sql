-- Publish rosters independently by division. The season advances after every division publishes.

create or replace function public.owner_publish_division_roster(p_division_id uuid,p_message text)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_conference_id uuid;v_season_id uuid;v_season_name text;v_division_name text;v_message text:=nullif(trim(p_message),'');v_broadcast_id uuid;
begin
  select season.conference_id,season.id,season.name,division.name into v_conference_id,v_season_id,v_season_name,v_division_name
  from public.divisions division join public.seasons season on season.id=division.season_id where division.id=p_division_id;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then raise exception 'Only the conference owner can share this division roster.'; end if;
  if v_message is null or char_length(v_message)>1000 then raise exception 'Enter a roster message of 1 to 1000 characters.'; end if;
  if exists(select 1 from public.season_broadcasts where division_id=p_division_id and broadcast_type='roster_draft') then raise exception 'This division roster has already been shared.'; end if;
  if exists(select 1 from public.teams team left join public.team_roster_drafts draft on draft.team_id=team.id where team.division_id=p_division_id and team.active and coalesce(draft.status,'editing')<>'approved') then raise exception 'Approve every team in this division before sharing.'; end if;
  if exists(select 1 from public.season_invitations invitation left join public.registrations registration on registration.id=invitation.registration_id where invitation.division_id=p_division_id and invitation.selection_status='eligible' and registration.team_id is null) then raise exception 'Every drafted player in this division must be assigned.'; end if;

  insert into public.season_broadcasts(season_id,division_id,message,created_by,broadcast_type)
  values(v_season_id,p_division_id,v_message,(select auth.uid()),'roster_draft') returning id into v_broadcast_id;
  update public.registrations set status='active' where division_id=p_division_id and team_id is not null;

  insert into public.fees(registration_id,category,description,amount_cents,status,due_on)
  select registration.id,'league',v_division_name||' League Fee',financial.league_fee_cents,'due',season.starts_on
  from public.registrations registration join public.seasons season on season.id=registration.season_id join public.division_financial_settings financial on financial.division_id=p_division_id
  where registration.division_id=p_division_id and registration.status='active' and financial.league_fee_enabled
    and not exists(select 1 from public.fees fee where fee.registration_id=registration.id and fee.category='league');

  insert into public.fees(registration_id,category,description,amount_cents,status,due_on)
  select registration.id,'uniform',v_division_name||' Uniform Fee',financial.uniform_fee_cents,'due',season.starts_on
  from public.registrations registration join public.seasons season on season.id=registration.season_id join public.division_financial_settings financial on financial.division_id=p_division_id
  where registration.division_id=p_division_id and registration.status='active' and financial.uniform_fee_enabled
    and not exists(select 1 from public.fees fee where fee.registration_id=registration.id and fee.category='uniform');

  insert into public.fees(registration_id,category,description,amount_cents,status,due_on)
  select registration.id,'platform',v_division_name||' Platform Fee',financial.platform_fee_cents,'due',season.starts_on
  from public.registrations registration join public.seasons season on season.id=registration.season_id join public.division_financial_settings financial on financial.division_id=p_division_id
  where registration.division_id=p_division_id and registration.status='active'
    and not exists(select 1 from public.fees fee where fee.registration_id=registration.id and fee.category='platform');

  insert into public.notifications(profile_id,notification_type,title,body,link_path,entity_id)
  select distinct player.profile_id,'roster_draft_published',v_season_name||' · '||v_division_name||' roster approved',v_message||' Your team and division fees are now available in KCH.','/my-team',v_broadcast_id
  from public.registrations registration join public.player_profiles player on player.id=registration.player_id
  where registration.division_id=p_division_id and registration.team_id is not null and player.profile_id is not null;

  if not exists(
    select 1 from public.divisions division
    where division.season_id=v_season_id and not exists(
      select 1 from public.season_broadcasts broadcast where broadcast.division_id=division.id and broadcast.broadcast_type='roster_draft'
    )
  ) then update public.seasons set setup_stage=6,registration_open=false where id=v_season_id; end if;

  insert into public.activity_log(conference_id,actor_profile_id,action,entity_type,entity_id,summary)
  values(v_conference_id,(select auth.uid()),'publish','division_roster',p_division_id::text,'Shared approved rosters and fees for '||v_division_name);
  return v_broadcast_id;
end;
$$;

revoke all on function public.owner_publish_division_roster(uuid,text) from public;
grant execute on function public.owner_publish_division_roster(uuid,text) to authenticated;

