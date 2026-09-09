-- Correct the packet ordering in case 0117 was applied before this fix.
create or replace function public.get_player_document_packet(
  p_invitation_id uuid default null,
  p_registration_id uuid default null
)
returns table(
  invitation_id uuid, registration_id uuid, conference_name text, season_name text,
  division_name text, document_type text, document_id uuid, title text, version text,
  effective_date date, content text, response text, responded_at timestamptz
)
language plpgsql security definer set search_path='' as $$
declare
  v_player_id uuid; v_invitation_id uuid; v_registration_id uuid; v_conference_id uuid;
  v_season_id uuid; v_division_id uuid; v_rules public.rules_documents;
begin
  select id into v_player_id from public.player_profiles where profile_id=(select auth.uid());
  if v_player_id is null then return; end if;
  if p_invitation_id is not null then
    select invitation.id,season.conference_id,invitation.season_id,invitation.division_id
    into v_invitation_id,v_conference_id,v_season_id,v_division_id
    from public.season_invitations invitation
    join public.seasons season on season.id=invitation.season_id
    where invitation.id=p_invitation_id and invitation.player_id=v_player_id and invitation.response='pending';
  else
    select registration.id,season.conference_id,registration.season_id,registration.division_id
    into v_registration_id,v_conference_id,v_season_id,v_division_id
    from public.registrations registration
    join public.seasons season on season.id=registration.season_id
    where registration.player_id=v_player_id
      and (p_registration_id is null or registration.id=p_registration_id)
      and registration.team_id is not null and registration.status in ('active','pending')
    order by season.starts_on desc,registration.created_at desc limit 1;
  end if;
  if v_conference_id is null or v_season_id is null or v_division_id is null then return; end if;
  select * into v_rules from public.ensure_default_season_rules(v_conference_id,v_season_id);
  perform public.ensure_standard_player_documents(v_conference_id,v_season_id);
  return query
  select v_invitation_id,v_registration_id,conference.name,season.name,division.name,
    'rules'::text,v_rules.id,v_rules.title,v_rules.version,v_rules.effective_date,v_rules.content,
    case when rule_ack.id is null then null else 'acknowledged' end,rule_ack.acknowledged_at
  from public.conferences conference
  join public.seasons season on season.conference_id=conference.id
  join public.divisions division on division.id=v_division_id
  left join public.player_rule_acknowledgments rule_ack
    on rule_ack.player_id=v_player_id and rule_ack.rules_document_id=v_rules.id
  where conference.id=v_conference_id and season.id=v_season_id
  union all
  select v_invitation_id,v_registration_id,conference.name,season.name,division.name,
    document.document_type,document.id,document.title,document.version,document.effective_date,
    document.content,document_response.response,document_response.responded_at
  from public.player_document_versions document
  join public.conferences conference on conference.id=document.conference_id
  join public.seasons season on season.id=document.season_id
  join public.divisions division on division.id=v_division_id
  left join public.player_document_responses document_response
    on document_response.player_id=v_player_id and document_response.document_version_id=document.id
  where document.conference_id=v_conference_id and document.season_id=v_season_id
    and document.status='published'
  order by 6;
end;
$$;

grant execute on function public.get_player_document_packet(uuid,uuid) to authenticated;
