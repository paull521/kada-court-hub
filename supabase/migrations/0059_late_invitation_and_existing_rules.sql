-- Commissioner late invitations and acknowledgement for existing signed-in players.
alter table public.season_invitations add column if not exists late_target_team_id uuid references public.teams(id) on delete set null;

create or replace function public.owner_send_late_team_invitation(p_team_id uuid,p_player_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_conference_id uuid;v_season_id uuid;v_division_id uuid;v_conference_name text;v_season_name text;v_division_name text;v_team_name text;v_profile_id uuid;v_broadcast_id uuid;v_deadline date;
begin
  select season.conference_id,season.id,division.id,conference.name,season.name,division.name,team.name
  into v_conference_id,v_season_id,v_division_id,v_conference_name,v_season_name,v_division_name,v_team_name
  from public.teams team join public.divisions division on division.id=team.division_id join public.seasons season on season.id=division.season_id join public.conferences conference on conference.id=season.conference_id
  where team.id=p_team_id and team.active and season.canceled_at is null;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then raise exception 'Only this conference commissioner can send a late invitation.'; end if;
  if current_date>coalesce((select ends_on from public.seasons where id=v_season_id),current_date) then raise exception 'This season has ended.'; end if;
  select profile_id into v_profile_id from public.player_profiles player join public.conference_player_pool pool on pool.player_id=player.id where player.id=p_player_id and pool.conference_id=v_conference_id;
  if v_profile_id is null then raise exception 'Late invitations can only be sent to an existing signed-in conference player.'; end if;
  if exists(select 1 from public.registrations where player_id=p_player_id and season_id=v_season_id and division_id=v_division_id and team_id is not null and status in ('active','pending')) then raise exception 'This player is already assigned in this division.'; end if;
  v_deadline:=least(coalesce((select ends_on from public.seasons where id=v_season_id),current_date+7),current_date+7);
  insert into public.season_broadcasts(season_id,division_id,message,created_by,broadcast_type,response_deadline,team_count,players_per_team)
  values(v_season_id,v_division_id,'You have been invited by '||v_conference_name||' to join '||v_team_name||' in '||v_season_name||' · '||v_division_name||'.',(select auth.uid()),'player_invitation',v_deadline,1,1) returning id into v_broadcast_id;
  insert into public.season_invitations(broadcast_id,season_id,division_id,player_id,registration_id,response,selection_status,late_target_team_id)
  values(v_broadcast_id,v_season_id,v_division_id,p_player_id,null,'pending','awaiting_response',p_team_id)
  on conflict(season_id,division_id,player_id) do update set broadcast_id=excluded.broadcast_id,response='pending',selection_status='awaiting_response',responded_at=null,registration_id=null,late_target_team_id=excluded.late_target_team_id;
  insert into public.notifications(profile_id,notification_type,title,body,link_path,entity_id)
  select v_profile_id,'season_invitation',v_season_name||' · '||v_division_name,'You have a late invitation to join '||v_team_name||'.','/home',invitation.id
  from public.season_invitations invitation where invitation.season_id=v_season_id and invitation.division_id=v_division_id and invitation.player_id=p_player_id
  on conflict(profile_id,notification_type,entity_id) do update set title=excluded.title,body=excluded.body,link_path=excluded.link_path,read_at=null,created_at=now();
  insert into public.activity_log(conference_id,actor_profile_id,action,entity_type,entity_id,summary)
  values(v_conference_id,(select auth.uid()),'owner_override','late_team_invitation',p_player_id::text,'Sent a late invitation for '||v_team_name||'.');
end;
$$;

create or replace function public.acknowledge_rules_and_join(p_invitation_id uuid,p_rules_document_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_player_id uuid;v_conference_id uuid;v_season_id uuid;v_division_id uuid;v_target_team_id uuid;v_registration_id uuid;v_document public.rules_documents;
begin
  select invitation.player_id,season.conference_id,invitation.season_id,invitation.division_id,invitation.late_target_team_id
  into v_player_id,v_conference_id,v_season_id,v_division_id,v_target_team_id
  from public.season_invitations invitation join public.seasons season on season.id=invitation.season_id join public.player_profiles player on player.id=invitation.player_id
  where invitation.id=p_invitation_id and player.profile_id=(select auth.uid()) and invitation.response='pending';
  if v_player_id is null then raise exception 'This invitation is no longer waiting for your response.'; end if;
  select * into v_document from public.rules_documents where id=p_rules_document_id and conference_id=v_conference_id and season_id=v_season_id and status='published';
  if v_document.id is null then raise exception 'The applicable rules are not available.'; end if;
  insert into public.player_rule_acknowledgments(player_id,conference_id,season_id,rules_document_id,rules_version,status) values(v_player_id,v_conference_id,v_season_id,v_document.id,v_document.version,'acknowledged') on conflict(player_id,rules_document_id) do nothing;
  perform public.respond_to_season_invitation(p_invitation_id,'joining');
  if v_target_team_id is not null then
    select registration_id into v_registration_id from public.season_invitations where id=p_invitation_id;
    update public.registrations set team_id=v_target_team_id,division_id=v_division_id,status='active',role_label='Player' where id=v_registration_id;
    insert into public.fees(registration_id,category,description,amount_cents,status,due_on)
    select v_registration_id,'league',division.name||' League Fee',financial.league_fee_cents,'due',season.starts_on from public.divisions division join public.seasons season on season.id=division.season_id join public.division_financial_settings financial on financial.division_id=division.id where division.id=v_division_id and financial.league_fee_enabled and not exists(select 1 from public.fees fee where fee.registration_id=v_registration_id and fee.category='league');
    insert into public.fees(registration_id,category,description,amount_cents,status,due_on)
    select v_registration_id,'uniform',division.name||' Uniform Fee',financial.uniform_fee_cents,'due',season.starts_on from public.divisions division join public.seasons season on season.id=division.season_id join public.division_financial_settings financial on financial.division_id=division.id where division.id=v_division_id and financial.uniform_fee_enabled and not exists(select 1 from public.fees fee where fee.registration_id=v_registration_id and fee.category='uniform');
    insert into public.fees(registration_id,category,description,amount_cents,status,due_on)
    select v_registration_id,'platform',division.name||' Platform Fee',financial.platform_fee_cents,'due',season.starts_on from public.divisions division join public.seasons season on season.id=division.season_id join public.division_financial_settings financial on financial.division_id=division.id where division.id=v_division_id and not exists(select 1 from public.fees fee where fee.registration_id=v_registration_id and fee.category='platform');
  end if;
end;
$$;

create or replace function public.get_required_rule_acknowledgment()
returns table(rules_document_id uuid,conference_name text,season_name text,division_name text,title text,version text,effective_date date,content text,acknowledged_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare v_player_id uuid;v_conference_id uuid;v_season_id uuid;v_document public.rules_documents;
begin
  select player.id,season.conference_id,season.id into v_player_id,v_conference_id,v_season_id
  from public.player_profiles player join public.registrations registration on registration.player_id=player.id join public.teams team on team.id=registration.team_id join public.divisions division on division.id=team.division_id join public.seasons season on season.id=division.season_id
  where player.profile_id=(select auth.uid()) and registration.status in ('active','pending') and season.canceled_at is null
  order by registration.created_at desc limit 1;
  if v_player_id is null then return; end if;
  select * into v_document from public.ensure_default_season_rules(v_conference_id,v_season_id);
  if exists(select 1 from public.player_rule_acknowledgments where player_id=v_player_id and rules_document_id=v_document.id) then return; end if;
  return query select v_document.id,conference.name,season.name,division.name,v_document.title,v_document.version,v_document.effective_date,v_document.content,null::timestamptz from public.registrations registration join public.teams team on team.id=registration.team_id join public.divisions division on division.id=team.division_id join public.seasons season on season.id=division.season_id join public.conferences conference on conference.id=season.conference_id where registration.player_id=v_player_id and season.id=v_season_id and registration.status in ('active','pending') limit 1;
end;
$$;

create or replace function public.acknowledge_existing_player_rules(p_rules_document_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_player_id uuid;v_conference_id uuid;v_season_id uuid;v_document public.rules_documents;
begin
  select player.id,season.conference_id,season.id into v_player_id,v_conference_id,v_season_id from public.player_profiles player join public.registrations registration on registration.player_id=player.id join public.teams team on team.id=registration.team_id join public.divisions division on division.id=team.division_id join public.seasons season on season.id=division.season_id where player.profile_id=(select auth.uid()) and registration.status in ('active','pending') and season.canceled_at is null order by registration.created_at desc limit 1;
  select * into v_document from public.rules_documents where id=p_rules_document_id and conference_id=v_conference_id and season_id=v_season_id and status='published';
  if v_player_id is null or v_document.id is null then raise exception 'These rules are not available for your active team.'; end if;
  insert into public.player_rule_acknowledgments(player_id,conference_id,season_id,rules_document_id,rules_version,status) values(v_player_id,v_conference_id,v_season_id,v_document.id,v_document.version,'acknowledged') on conflict(player_id,rules_document_id) do nothing;
end;
$$;

revoke all on function public.owner_send_late_team_invitation(uuid,uuid) from public;
grant execute on function public.owner_send_late_team_invitation(uuid,uuid) to authenticated;
grant execute on function public.get_required_rule_acknowledgment() to authenticated;
grant execute on function public.acknowledge_existing_player_rules(uuid) to authenticated;
