-- Publishing approved rosters activates players, creates division fees, and notifies teams.

create or replace function public.owner_publish_roster_draft(p_season_id uuid,p_message text)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_conference_id uuid;v_season_name text;v_message text:=nullif(trim(p_message),'');v_broadcast_id uuid;
begin
  select conference_id,name into v_conference_id,v_season_name from public.seasons where id=p_season_id for update;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then raise exception 'Only a conference owner can publish roster drafts.'; end if;
  if v_message is null or char_length(v_message)>1000 then raise exception 'Enter a roster message of 1 to 1000 characters.'; end if;
  if exists(select 1 from public.teams team join public.divisions division on division.id=team.division_id left join public.team_roster_drafts draft on draft.team_id=team.id where division.season_id=p_season_id and team.active and coalesce(draft.status,'editing')<>'approved') then raise exception 'Approve every team roster before sharing.'; end if;
  if exists(select 1 from public.season_invitations invitation left join public.registrations registration on registration.id=invitation.registration_id where invitation.season_id=p_season_id and invitation.selection_status='eligible' and registration.team_id is null) then raise exception 'Every drafted player must be assigned before sharing.'; end if;

  insert into public.season_broadcasts(season_id,message,created_by,broadcast_type) values(p_season_id,v_message,(select auth.uid()),'roster_draft') returning id into v_broadcast_id;
  update public.registrations set status='active' where season_id=p_season_id and team_id is not null;

  insert into public.fees(registration_id,category,description,amount_cents,status,due_on)
  select registration.id,'league',division.name||' League Fee',financial.league_fee_cents,'due',season.starts_on
  from public.registrations registration join public.teams team on team.id=registration.team_id join public.divisions division on division.id=team.division_id join public.seasons season on season.id=registration.season_id join public.division_financial_settings financial on financial.division_id=division.id
  where registration.season_id=p_season_id and registration.status='active' and financial.league_fee_enabled
    and not exists(select 1 from public.fees fee where fee.registration_id=registration.id and fee.category='league');

  insert into public.fees(registration_id,category,description,amount_cents,status,due_on)
  select registration.id,'uniform',division.name||' Uniform Fee',financial.uniform_fee_cents,'due',season.starts_on
  from public.registrations registration join public.teams team on team.id=registration.team_id join public.divisions division on division.id=team.division_id join public.seasons season on season.id=registration.season_id join public.division_financial_settings financial on financial.division_id=division.id
  where registration.season_id=p_season_id and registration.status='active' and financial.uniform_fee_enabled
    and not exists(select 1 from public.fees fee where fee.registration_id=registration.id and fee.category='uniform');

  insert into public.fees(registration_id,category,description,amount_cents,status,due_on)
  select registration.id,'platform',division.name||' Platform Fee',financial.platform_fee_cents,'due',season.starts_on
  from public.registrations registration join public.teams team on team.id=registration.team_id join public.divisions division on division.id=team.division_id join public.seasons season on season.id=registration.season_id join public.division_financial_settings financial on financial.division_id=division.id
  where registration.season_id=p_season_id and registration.status='active'
    and not exists(select 1 from public.fees fee where fee.registration_id=registration.id and fee.category='platform');

  insert into public.notifications(profile_id,notification_type,title,body,link_path,entity_id)
  select distinct player.profile_id,'roster_draft_published',v_season_name||' roster approved',v_message||' Your team assignment and division fees are now available in KCH.','/my-team',v_broadcast_id
  from public.registrations registration join public.player_profiles player on player.id=registration.player_id
  where registration.season_id=p_season_id and registration.team_id is not null and player.profile_id is not null;

  update public.seasons set setup_stage=6,registration_open=false where id=p_season_id;
  insert into public.activity_log(conference_id,actor_profile_id,action,entity_type,entity_id,summary)
  values(v_conference_id,(select auth.uid()),'publish','roster_draft',v_broadcast_id::text,'Shared approved rosters and created associated fees for '||v_season_name);
  return v_broadcast_id;
end;
$$;

revoke all on function public.owner_publish_roster_draft(uuid,text) from public;
grant execute on function public.owner_publish_roster_draft(uuid,text) to authenticated;

