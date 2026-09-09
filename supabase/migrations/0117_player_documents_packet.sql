-- Player Documents: preserve the existing immutable Rules records and add
-- independently versioned Participation Agreement and Multimedia Release records.

create table if not exists public.player_document_versions (
  id uuid primary key default gen_random_uuid(),
  conference_id uuid not null references public.conferences(id) on delete restrict,
  season_id uuid not null references public.seasons(id) on delete restrict,
  document_type text not null check (document_type in ('participation_agreement','multimedia_release')),
  title text not null,
  version text not null,
  effective_date date not null,
  status text not null default 'published' check (status in ('draft','published','archived')),
  content text not null,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  locked_at timestamptz,
  unique (conference_id, season_id, document_type, version)
);

create table if not exists public.player_document_responses (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.player_profiles(id) on delete restrict,
  conference_id uuid not null references public.conferences(id) on delete restrict,
  season_id uuid not null references public.seasons(id) on delete restrict,
  division_id uuid not null references public.divisions(id) on delete restrict,
  document_version_id uuid not null references public.player_document_versions(id) on delete restrict,
  response text not null check (response in ('accepted','declined')),
  legal_name text,
  responded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (player_id, document_version_id)
);

create index if not exists player_document_responses_player_idx
  on public.player_document_responses(player_id, responded_at desc);

alter table public.player_document_versions enable row level security;
alter table public.player_document_responses enable row level security;

create or replace function public.prevent_published_player_document_change()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if tg_op='UPDATE' and old.status in ('published','archived') then
    raise exception 'Published player documents cannot be edited. Create a new version instead.';
  end if;
  if tg_op='DELETE' and exists(
    select 1 from public.player_document_responses where document_version_id=old.id
  ) then
    raise exception 'A player document with responses cannot be deleted.';
  end if;
  return case when tg_op='DELETE' then old else new end;
end;
$$;

drop trigger if exists player_document_versions_immutable on public.player_document_versions;
create trigger player_document_versions_immutable
before update or delete on public.player_document_versions
for each row execute function public.prevent_published_player_document_change();

create or replace function public.kch_default_participation_agreement_content()
returns text language sql immutable set search_path='' as $$
  select $document$
PLEASE READ CAREFULLY. THIS AGREEMENT AFFECTS LEGAL RIGHTS. It is required for participation and applies only to the conference, division, and season identified above.

1. Voluntary Participation
I voluntarily choose to participate in basketball games, practices, evaluations, tournaments, playoffs, meetings, and related conference activities (collectively, “Activities”). I understand that participation is not required and that I may stop participating at any time, subject to the conference rules and refund policies.

2. Acknowledgment and Assumption of Risks
Basketball is a strenuous contact sport. I understand that known and unexpected risks may cause property damage, illness, serious injury, permanent disability, paralysis, concussion, cardiac event, or death. Risks include contact or collision with players, officials, spectators, walls, floors, goals, equipment, or other objects; falls, sudden stops, jumping, running, overexertion, dehydration, and aggravation of an existing condition; sprains, strains, fractures, dislocations, cuts, dental injuries, eye injuries, and head or brain injuries; court defects, wet or slippery surfaces, inadequate lighting, equipment failure, and acts or omissions of other participants; and communicable illness and risks associated with transportation or presence at a venue. I knowingly and voluntarily assume the inherent and other risks of the Activities, except to the extent a risk or claim cannot legally be assumed or released.

3. Health, Fitness, and Injury Reporting
I represent that I am physically capable of participating or will obtain appropriate medical advice before participating. I am responsible for using reasonable judgment about my condition, following safety instructions, and promptly reporting injuries, symptoms, medical restrictions, and suspected concussion. I will not participate while impaired or when a medical provider has restricted participation. A player suspected of concussion or serious injury may be removed from play. The conference may require clearance when reasonably necessary for safety.

4. Emergency Medical Authorization
If I am injured or unable to consent, I authorize conference personnel or their designees to contact emergency services and arrange reasonably necessary first aid or medical treatment. I understand that they are not required to provide medical care and are not guaranteeing its availability or outcome. I am responsible for resulting medical and transportation expenses, subject to applicable insurance and law.

5. Release of Liability
To the fullest extent permitted by Washington law, I release and agree not to sue the Conference, its owner or operator, KadaCourtHub solely in its role as a technology platform, participating teams, venue owners and operators, sponsors, officers, directors, employees, coaches, captains, officials, scorekeepers, contractors, and volunteers (collectively, “Released Parties”) for claims arising from ordinary negligence connected with the Activities, including claims for personal injury, death, or property loss. This release does not apply to gross negligence, reckless or intentional misconduct, or any right or claim that cannot lawfully be released.

6. Participant Responsibility
I am responsible for my own conduct and for losses I cause through my intentional misconduct or violation of law. I agree to follow reasonable safety directions, facility requirements, and the separately presented Conference Rules and Discipline. This Agreement does not replace or incorporate those rules.

7. Insurance and Personal Property
I understand that the Released Parties may not provide medical, disability, accident, or personal-property insurance for me. I am responsible for confirming my own coverage and safeguarding my belongings.

8. General Terms
This Agreement is governed by Washington law. If any provision is unenforceable, it will be limited or severed to the minimum extent necessary, and the remaining provisions will continue in effect. This Agreement is the entire agreement concerning the subjects it addresses and may be changed only in a written record accepted by the parties. An electronic record or signature may be used, and an accurate copy may be retained and provided to the signer.

Signature and Electronic Acceptance
By accepting, I confirm that I have read this entire Agreement, understand it, have had an opportunity to ask questions, and voluntarily agree to its terms. My typed legal name is my electronic signature.
$document$;
$$;

create or replace function public.kch_default_multimedia_release_content()
returns text language sql immutable set search_path='' as $$
  select $document$
THIS RELEASE IS OPTIONAL. A PLAYER MAY DECLINE WITHOUT LOSING ELIGIBILITY TO REGISTER OR PLAY. The player may later change this choice for future use through the conference’s designated process.

1. Media Covered
If I accept, I authorize the Conference and its authorized representatives to photograph, film, livestream, record, or otherwise capture my name, image, likeness, voice, uniform number, team affiliation, game participation, and athletic performance during conference-related activities (“Media”).

2. Permitted Uses
If I accept, the Conference may reproduce, edit, display, publish, distribute, and archive the Media for conference-related game coverage, livestreams, highlights, standings, schedules, awards, historical records, Conference websites, KadaCourtHub conference pages, social-media accounts, emails, presentations, printed materials, and promotion of the Conference, its seasons, teams, events, and community activities. The Conference may reasonably crop, caption, resize, or combine the Media, but may not knowingly use it in a defamatory, misleading, unlawful, or materially altered manner that falsely portrays me.

3. Ownership, Compensation, and Third-Party Platforms
If I accept, I understand that I will not receive compensation for authorized uses. The Conference or the person creating the Media may own the recording or image, subject to my rights under this Release and applicable law. Media posted publicly may be viewed, copied, shared, or retained by others, and complete removal from third-party platforms or search results cannot be guaranteed.

4. Duration and Withdrawal
My choice applies to the conference, division, and season identified above. If I accept and later withdraw permission, the withdrawal applies prospectively after the Conference receives and records it. The Conference will make reasonable efforts to stop new promotional uses, but withdrawal does not require recall or destruction of materials already printed, published, distributed, archived as historical records, included in completed productions, or retained where required by law.

5. Livestreams and Incidental Appearance
Declining means the Conference will not intentionally feature me in promotional Media where reasonably avoidable. I understand, however, that basketball games are group events and that the Conference may need a separate operational policy regarding incidental appearance in wide-angle game footage, livestreams, crowd scenes, security recordings, or newsworthy event documentation. Any such policy must be disclosed separately and applied consistently; this optional Release does not itself create mandatory consent.

6. Release for Authorized Media Use
If I accept, to the fullest extent permitted by law, I release the Conference, KadaCourtHub solely in its role as a technology platform, and their authorized representatives from claims arising from the uses expressly authorized by this Release, including claims based on privacy, publicity, or approval of the finished material. This does not release unauthorized use, gross negligence, reckless or intentional misconduct, or rights that cannot legally be released.

7. General Terms
This Release is governed by Washington law. If any provision is unenforceable, it will be limited or severed to the minimum extent necessary. An electronic record or signature may be used. The Conference retains the selected response, document version, conference, division, season, player identity, and timestamp.
$document$;
$$;

create or replace function public.ensure_standard_player_documents(p_conference_id uuid, p_season_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_effective_date date;
begin
  select coalesce(starts_on,current_date) into v_effective_date
  from public.seasons where id=p_season_id and conference_id=p_conference_id;
  if v_effective_date is null then raise exception 'The player documents context is unavailable.'; end if;

  insert into public.player_document_versions(
    conference_id,season_id,document_type,title,version,effective_date,status,content,published_at,locked_at
  ) values
    (p_conference_id,p_season_id,'participation_agreement','Basketball Participation Agreement','2026.1',v_effective_date,'published',public.kch_default_participation_agreement_content(),now(),now()),
    (p_conference_id,p_season_id,'multimedia_release','Photo, Video, and Multimedia Release','2026.1',v_effective_date,'published',public.kch_default_multimedia_release_content(),now(),now())
  on conflict (conference_id,season_id,document_type,version) do nothing;
end;
$$;

create or replace function public.get_player_document_packet(
  p_invitation_id uuid default null,
  p_registration_id uuid default null
)
returns table(
  invitation_id uuid,
  registration_id uuid,
  conference_name text,
  season_name text,
  division_name text,
  document_type text,
  document_id uuid,
  title text,
  version text,
  effective_date date,
  content text,
  response text,
  responded_at timestamptz
)
language plpgsql security definer set search_path='' as $$
declare
  v_player_id uuid;
  v_invitation_id uuid;
  v_registration_id uuid;
  v_conference_id uuid;
  v_season_id uuid;
  v_division_id uuid;
  v_rules public.rules_documents;
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
      and registration.team_id is not null
      and registration.status in ('active','pending')
    order by season.starts_on desc,registration.created_at desc
    limit 1;
  end if;
  if v_conference_id is null or v_season_id is null or v_division_id is null then return; end if;

  select * into v_rules from public.ensure_default_season_rules(v_conference_id,v_season_id);
  perform public.ensure_standard_player_documents(v_conference_id,v_season_id);

  return query
  select
    v_invitation_id,
    v_registration_id,
    conference.name,
    season.name,
    division.name,
    'rules'::text,
    v_rules.id,
    v_rules.title,
    v_rules.version,
    v_rules.effective_date,
    v_rules.content,
    case when rule_ack.id is null then null else 'acknowledged' end,
    rule_ack.acknowledged_at
  from public.conferences conference
  join public.seasons season on season.conference_id=conference.id
  join public.divisions division on division.id=v_division_id
  left join public.player_rule_acknowledgments rule_ack
    on rule_ack.player_id=v_player_id and rule_ack.rules_document_id=v_rules.id
  where conference.id=v_conference_id and season.id=v_season_id
  union all
  select
    v_invitation_id,
    v_registration_id,
    conference.name,
    season.name,
    division.name,
    document.document_type,
    document.id,
    document.title,
    document.version,
    document.effective_date,
    document.content,
    document_response.response,
    document_response.responded_at
  from public.player_document_versions document
  join public.conferences conference on conference.id=document.conference_id
  join public.seasons season on season.id=document.season_id
  join public.divisions division on division.id=v_division_id
  left join public.player_document_responses document_response
    on document_response.player_id=v_player_id and document_response.document_version_id=document.id
  where document.conference_id=v_conference_id
    and document.season_id=v_season_id
    and document.status='published'
  order by 6;
end;
$$;

create or replace function public.respond_to_player_document(
  p_invitation_id uuid default null,
  p_registration_id uuid default null,
  p_document_type text default null,
  p_document_id uuid default null,
  p_response text default null,
  p_legal_name text default null
)
returns boolean language plpgsql security definer set search_path='' as $$
declare
  v_player_id uuid;
  v_invitation_id uuid;
  v_registration_id uuid;
  v_conference_id uuid;
  v_season_id uuid;
  v_division_id uuid;
  v_rules public.rules_documents;
  v_document public.player_document_versions;
  v_complete boolean;
begin
  select id into v_player_id from public.player_profiles where profile_id=(select auth.uid());
  if v_player_id is null then raise exception 'Log in before responding to player documents.'; end if;

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
    where registration.id=p_registration_id and registration.player_id=v_player_id
      and registration.team_id is not null and registration.status in ('active','pending');
  end if;
  if v_conference_id is null or v_season_id is null or v_division_id is null then
    raise exception 'These player documents are not available for this team.';
  end if;
  if p_document_type not in ('rules','participation_agreement','multimedia_release') then
    raise exception 'This player document is not available.';
  end if;

  select * into v_rules from public.ensure_default_season_rules(v_conference_id,v_season_id);
  perform public.ensure_standard_player_documents(v_conference_id,v_season_id);

  if p_document_type='rules' then
    if p_document_id<>v_rules.id or p_response<>'acknowledged' then
      raise exception 'The Rules & Discipline response is not valid.';
    end if;
    insert into public.player_rule_acknowledgments(player_id,conference_id,season_id,rules_document_id,rules_version,status)
    values(v_player_id,v_conference_id,v_season_id,v_rules.id,v_rules.version,'acknowledged')
    on conflict(player_id,rules_document_id) do nothing;
  else
    select * into v_document from public.player_document_versions
    where id=p_document_id and conference_id=v_conference_id and season_id=v_season_id
      and document_type=p_document_type and status='published';
    if v_document.id is null then raise exception 'This player document is not available.'; end if;
    if p_document_type='participation_agreement' then
      if p_response<>'accepted' or length(trim(coalesce(p_legal_name,'')))<2 then
        raise exception 'Enter your legal name to accept the Participation Agreement.';
      end if;
    elsif p_response not in ('accepted','declined') then
      raise exception 'Choose Accept or Decline for the Multimedia Release.';
    end if;
    insert into public.player_document_responses(
      player_id,conference_id,season_id,division_id,document_version_id,response,legal_name
    ) values(
      v_player_id,v_conference_id,v_season_id,v_division_id,v_document.id,p_response,
      case when p_document_type='participation_agreement' then trim(p_legal_name) else null end
    ) on conflict(player_id,document_version_id) do nothing;
  end if;

  select
    exists(select 1 from public.player_rule_acknowledgments where player_id=v_player_id and rules_document_id=v_rules.id)
    and exists(
      select 1 from public.player_document_responses response
      join public.player_document_versions document on document.id=response.document_version_id
      where response.player_id=v_player_id and response.conference_id=v_conference_id and response.season_id=v_season_id
        and document.document_type='participation_agreement' and response.response='accepted' and document.status='published'
    )
    and exists(
      select 1 from public.player_document_responses response
      join public.player_document_versions document on document.id=response.document_version_id
      where response.player_id=v_player_id and response.conference_id=v_conference_id and response.season_id=v_season_id
        and document.document_type='multimedia_release' and response.response in ('accepted','declined') and document.status='published'
    ) into v_complete;

  if v_complete and v_invitation_id is not null then
    perform public.acknowledge_rules_and_join(v_invitation_id,v_rules.id);
  end if;
  return v_complete;
end;
$$;

grant execute on function public.get_player_document_packet(uuid,uuid) to authenticated;
grant execute on function public.respond_to_player_document(uuid,uuid,text,uuid,text,text) to authenticated;
