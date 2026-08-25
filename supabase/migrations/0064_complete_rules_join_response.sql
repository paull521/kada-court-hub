-- Make the acknowledgement step conclusively complete the invitation response.
-- This prevents Home from showing the same pending invitation again after Rules
-- & Discipline has been acknowledged.
create or replace function public.acknowledge_rules_and_join(p_invitation_id uuid,p_rules_document_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_player_id uuid;v_conference_id uuid;v_season_id uuid;v_division_id uuid;v_target_team_id uuid;v_registration_id uuid;v_document public.rules_documents;
begin
  select invitation.player_id,season.conference_id,invitation.season_id,invitation.division_id,invitation.late_target_team_id
  into v_player_id,v_conference_id,v_season_id,v_division_id,v_target_team_id
  from public.season_invitations invitation
  join public.seasons season on season.id=invitation.season_id
  join public.player_profiles player on player.id=invitation.player_id
  where invitation.id=p_invitation_id and player.profile_id=(select auth.uid()) and invitation.response='pending';

  if v_player_id is null then raise exception 'This invitation is no longer waiting for your response.'; end if;

  select * into v_document
  from public.rules_documents
  where id=p_rules_document_id and conference_id=v_conference_id and season_id=v_season_id and status='published';
  if v_document.id is null then raise exception 'The applicable rules are not available.'; end if;

  insert into public.player_rule_acknowledgments(player_id,conference_id,season_id,rules_document_id,rules_version,status)
  values(v_player_id,v_conference_id,v_season_id,v_document.id,v_document.version,'acknowledged')
  on conflict(player_id,rules_document_id) do nothing;

  perform public.respond_to_season_invitation(p_invitation_id,'joining');

  select registration_id into v_registration_id
  from public.season_invitations where id=p_invitation_id;

  -- Explicitly persist the completed response, even when the invitation is
  -- assigned directly to a team through a late invitation.
  update public.season_invitations
  set response='joining',
      selection_status=case when selection_status in ('eligible','waitlisted') then selection_status else 'eligible' end,
      responded_at=coalesce(responded_at,now()),
      registration_id=coalesce(registration_id,v_registration_id)
  where id=p_invitation_id;

  if v_target_team_id is not null then
    update public.registrations
    set team_id=v_target_team_id,division_id=v_division_id,status='active',role_label='Player'
    where id=v_registration_id;

    insert into public.fees(registration_id,category,description,amount_cents,status,due_on)
    select v_registration_id,'league',division.name||' League Fee',financial.league_fee_cents,'due',season.starts_on
    from public.divisions division
    join public.seasons season on season.id=division.season_id
    join public.division_financial_settings financial on financial.division_id=division.id
    where division.id=v_division_id and financial.league_fee_enabled
      and not exists(select 1 from public.fees fee where fee.registration_id=v_registration_id and fee.category='league');

    insert into public.fees(registration_id,category,description,amount_cents,status,due_on)
    select v_registration_id,'uniform',division.name||' Uniform Fee',financial.uniform_fee_cents,'due',season.starts_on
    from public.divisions division
    join public.seasons season on season.id=division.season_id
    join public.division_financial_settings financial on financial.division_id=division.id
    where division.id=v_division_id and financial.uniform_fee_enabled
      and not exists(select 1 from public.fees fee where fee.registration_id=v_registration_id and fee.category='uniform');

    insert into public.fees(registration_id,category,description,amount_cents,status,due_on)
    select v_registration_id,'platform',division.name||' Platform Fee',financial.platform_fee_cents,'due',season.starts_on
    from public.divisions division
    join public.seasons season on season.id=division.season_id
    join public.division_financial_settings financial on financial.division_id=division.id
    where division.id=v_division_id
      and not exists(select 1 from public.fees fee where fee.registration_id=v_registration_id and fee.category='platform');
  end if;
end;
$$;

grant execute on function public.acknowledge_rules_and_join(uuid,uuid) to authenticated;
