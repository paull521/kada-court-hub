-- Immutable rules documents and player acknowledgments.
create table if not exists public.rules_documents (
  id uuid primary key default gen_random_uuid(),
  conference_id uuid not null references public.conferences(id) on delete restrict,
  season_id uuid not null references public.seasons(id) on delete restrict,
  title text not null,
  version text not null,
  effective_date date not null,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  source_type text not null check (source_type in ('kch_default','conference_custom')),
  content text not null,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  locked_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  unique (conference_id,season_id,version)
);

create table if not exists public.player_rule_acknowledgments (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.player_profiles(id) on delete restrict,
  conference_id uuid not null references public.conferences(id) on delete restrict,
  season_id uuid not null references public.seasons(id) on delete restrict,
  rules_document_id uuid not null references public.rules_documents(id) on delete restrict,
  rules_version text not null,
  acknowledged_at timestamptz not null default now(),
  status text not null default 'acknowledged' check (status='acknowledged'),
  created_at timestamptz not null default now(),
  unique (player_id,rules_document_id)
);

create index if not exists player_rule_acknowledgments_player_idx on public.player_rule_acknowledgments(player_id,acknowledged_at desc);

create or replace function public.prevent_published_rules_change()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  if tg_op='UPDATE' and old.status in ('published','archived') then raise exception 'Published rules cannot be edited. Create a new version instead.'; end if;
  if tg_op='DELETE' and exists(select 1 from public.player_rule_acknowledgments where rules_document_id=old.id) then raise exception 'Acknowledged rules cannot be deleted.'; end if;
  return case when tg_op='DELETE' then old else new end;
end;
$$;

drop trigger if exists rules_documents_immutable on public.rules_documents;
create trigger rules_documents_immutable before update or delete on public.rules_documents for each row execute function public.prevent_published_rules_change();

create or replace function public.kch_default_rules_content()
returns text language sql immutable set search_path=''
as $$
  select $rules$
KCH Default League Rules & Discipline

1. Player Eligibility
Players must be properly registered for the applicable conference, division, and season; meet eligibility requirements established by the Commissioner; be listed on an approved team roster before participating; complete required acknowledgments; and comply with league requirements unless waived by the Commissioner. A player may not participate under another player’s identity or knowingly provide false eligibility information.

2. Rosters and Team Assignment
Only players appearing on the official roster may participate in league games. Roster additions, removals, substitutions, and transfers are subject to Commissioner approval and applicable roster-lock deadlines. Players may participate only for the team and division for which they are officially registered unless the Commissioner authorizes otherwise.

3. Game Rules
Unless otherwise specified by the Commissioner, games follow recognized basketball rules and officiating standards. The Commissioner may establish rules for game duration, periods, clocks, time-outs, overtime, fouls, free throws, mercy rules, shot clocks, uniforms, minimum players, forfeits, and playoffs. Game officials have authority over basketball decisions during the game. Officials’ judgment calls are final unless the league establishes a specific review procedure.

4. Sportsmanship
All players, captains, coaches, team personnel, and spectators must conduct themselves respectfully. Excessive or abusive trash talking, taunting, threats, abusive or discriminatory language, harassment, repeated disrespect toward officials, unsportsmanlike gestures, and repeated disruption may result in warnings, technical fouls, ejection, suspension, or other discipline. Competitive conversation and normal basketball emotion are permitted; threatening, abusive, or disruptive conduct is not.

5. Technical Fouls and Ejections
Unless modified by the Commissioner, two technical fouls assessed to the same player during one game result in automatic ejection. An official may immediately eject a player for serious misconduct. An ejected player must leave the playing area when instructed. Failure to leave may result in additional discipline.

6. Fighting and Physical Altercations
Fighting is prohibited. Fighting includes punching, kicking, striking outside normal basketball play, choking, throwing a dangerous object, leaving the bench to participate in a confrontation, or continuing aggressive contact after separation is attempted. A player involved in a fight may be immediately ejected and temporarily suspended while reviewed. Penalties may include a warning, one or more game suspensions, season suspension, multi-season suspension, or permanent removal. The Commissioner may consider severity, initiation, escalation, injuries, prior history, and available evidence.

7. Leaving the Bench During an Altercation
Players and team personnel not already participating in an altercation should remain away from it. Leaving the bench or sideline to participate in or escalate a confrontation may result in ejection and additional discipline. Captains and designated representatives should assist officials in keeping teammates away when safe.

8. Intentional or Dangerous Plays
Normal basketball contact is expected; intentionally dangerous conduct is prohibited. This includes deliberately striking a player, undercutting an airborne player, deliberately pushing a player into a wall or spectators, excessive contact unrelated to a legitimate play, or conduct intended to injure. Officials may assess applicable fouls and eject the player. The Commissioner may review the incident for additional discipline.

9. Conduct Toward Officials
Players may respectfully ask an official for clarification. Repeated arguing, intimidation, threats, abusive language, aggressive confrontation, or physical contact with an official is prohibited. Threatening or intentionally striking an official may result in immediate suspension and permanent removal.

10. Spectator Conduct
Spectators must follow the same standards of respectful conduct. The Commissioner or facility may remove spectators who threaten participants, enter the court without authorization, participate in an altercation, repeatedly disrupt a game, or engage in abusive or dangerous conduct. Players and teams may be expected to help control associated spectators when appropriate.

11. Alcohol, Drugs, Weapons, and Facilities
Players may not participate while impaired by alcohol or illegal drugs. Weapons are prohibited at league activities except where specifically authorized by law and facility policy. Participants must comply with facility rules and may be responsible for damage they intentionally cause. Nothing in these rules overrides applicable law or facility requirements.

12. Incident Review, Notice, and Appeals
Serious incidents may be reviewed by the Commissioner or a designated person or committee. Review may consider referee or scorekeeper reports, video, photographs, participant and witness statements, messages, prior disciplinary history, and other reliable information. A temporary suspension may be imposed while review is underway. The affected player should be informed of the incident, alleged violation, temporary suspension, and final decision. For serious penalties, the player should normally have a reasonable opportunity to provide their account. Unless the Commissioner establishes a different procedure, a player receiving a suspension beyond the league-defined threshold or permanent removal may request one review within seven calendar days after notice. An appeal does not automatically delay a suspension.

13. Rule Changes and Authority
Material rule changes require a new version number, effective date, and publication of a new rules version. Rules applicable to an incident should ordinarily be those in effect when it occurred. KCH preserves prior acknowledged versions. The Commissioner retains authority over participation, eligibility, rosters, scheduling, suspensions, discipline, league-specific rules, and conference operations. KCH provides publication, acknowledgment, timestamping, and historical records; KCH does not decide individual disciplinary matters, crimes, or appeals.
$rules$;
$$;

create or replace function public.ensure_default_season_rules(p_conference_id uuid,p_season_id uuid)
returns public.rules_documents language plpgsql security definer set search_path=''
as $$
declare v_document public.rules_documents;
begin
  select * into v_document from public.rules_documents where conference_id=p_conference_id and season_id=p_season_id and status='published' order by effective_date desc,created_at desc limit 1;
  if v_document.id is not null then return v_document; end if;
  insert into public.rules_documents(conference_id,season_id,title,version,effective_date,status,source_type,content,published_at,locked_at)
  select p_conference_id,p_season_id,'League Rules & Discipline','2026.1',coalesce(starts_on,current_date),'published','kch_default',public.kch_default_rules_content(),now(),now()
  from public.seasons where id=p_season_id
  on conflict(conference_id,season_id,version) do nothing
  returning * into v_document;
  if v_document.id is null then select * into v_document from public.rules_documents where conference_id=p_conference_id and season_id=p_season_id and status='published' order by effective_date desc,created_at desc limit 1; end if;
  return v_document;
end;
$$;

create or replace function public.get_invitation_rules(p_invitation_id uuid)
returns table(invitation_id uuid,rules_document_id uuid,conference_name text,season_name text,division_name text,title text,version text,effective_date date,content text,acknowledged_at timestamptz)
language plpgsql security definer set search_path=''
as $$
declare v_player_id uuid;v_conference_id uuid;v_season_id uuid;v_document public.rules_documents;
begin
  select invitation.player_id,season.conference_id,invitation.season_id into v_player_id,v_conference_id,v_season_id from public.season_invitations invitation join public.seasons season on season.id=invitation.season_id join public.player_profiles player on player.id=invitation.player_id where invitation.id=p_invitation_id and player.profile_id=(select auth.uid());
  if v_player_id is null then raise exception 'This invitation is not available to this player.'; end if;
  select * into v_document from public.ensure_default_season_rules(v_conference_id,v_season_id);
  return query select p_invitation_id,v_document.id,conference.name,season.name,division.name,v_document.title,v_document.version,v_document.effective_date,v_document.content,ack.acknowledged_at from public.season_invitations invitation join public.seasons season on season.id=invitation.season_id join public.conferences conference on conference.id=season.conference_id join public.divisions division on division.id=invitation.division_id left join public.player_rule_acknowledgments ack on ack.player_id=invitation.player_id and ack.rules_document_id=v_document.id where invitation.id=p_invitation_id;
end;
$$;

create or replace function public.get_player_rule_acknowledgments()
returns table(acknowledgment_id uuid,rules_document_id uuid,conference_name text,season_name text,title text,version text,effective_date date,content text,acknowledged_at timestamptz)
language sql stable security definer set search_path=''
as $$
  select ack.id,document.id,conference.name,season.name,document.title,document.version,document.effective_date,document.content,ack.acknowledged_at
  from public.player_rule_acknowledgments ack join public.player_profiles player on player.id=ack.player_id join public.rules_documents document on document.id=ack.rules_document_id join public.conferences conference on conference.id=ack.conference_id join public.seasons season on season.id=ack.season_id
  where player.profile_id=(select auth.uid()) order by ack.acknowledged_at desc;
$$;

create or replace function public.acknowledge_rules_and_join(p_invitation_id uuid,p_rules_document_id uuid)
returns void language plpgsql security definer set search_path=''
as $$
declare v_player_id uuid;v_conference_id uuid;v_season_id uuid;v_document public.rules_documents;
begin
  select invitation.player_id,season.conference_id,invitation.season_id into v_player_id,v_conference_id,v_season_id from public.season_invitations invitation join public.seasons season on season.id=invitation.season_id join public.player_profiles player on player.id=invitation.player_id where invitation.id=p_invitation_id and player.profile_id=(select auth.uid()) and invitation.response='pending';
  if v_player_id is null then raise exception 'This invitation is no longer waiting for your response.'; end if;
  select * into v_document from public.rules_documents where id=p_rules_document_id and conference_id=v_conference_id and season_id=v_season_id and status='published';
  if v_document.id is null then raise exception 'The applicable rules are not available.'; end if;
  insert into public.player_rule_acknowledgments(player_id,conference_id,season_id,rules_document_id,rules_version,status) values(v_player_id,v_conference_id,v_season_id,v_document.id,v_document.version,'acknowledged') on conflict(player_id,rules_document_id) do nothing;
  perform public.respond_to_season_invitation(p_invitation_id,'joining');
end;
$$;

create or replace function public.prepare_division_join_from_link(p_division_id uuid)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_player_id uuid;v_conference_id uuid;v_season_id uuid;v_broadcast_id uuid;v_invitation_id uuid;
begin
  select id into v_player_id from public.player_profiles where profile_id=(select auth.uid());
  if v_player_id is null then raise exception 'Create a KCH profile before joining.'; end if;
  select season.conference_id,season.id into v_conference_id,v_season_id from public.divisions division join public.seasons season on season.id=division.season_id where division.id=p_division_id;
  if v_conference_id is null then raise exception 'This division link is not valid.'; end if;
  if exists(select 1 from public.season_broadcasts where division_id=p_division_id and broadcast_type='roster_final') then raise exception 'This division roster is already final.'; end if;
  select id into v_broadcast_id from public.season_broadcasts where division_id=p_division_id and broadcast_type='player_invitation' and response_deadline>=current_date order by created_at desc limit 1;
  if v_broadcast_id is null then raise exception 'This division is not accepting player responses right now.'; end if;
  insert into public.conference_player_pool(conference_id,player_id) values(v_conference_id,v_player_id) on conflict do nothing;
  insert into public.season_invitations(broadcast_id,season_id,division_id,player_id,registration_id,response,selection_status) values(v_broadcast_id,v_season_id,p_division_id,v_player_id,null,'pending','awaiting_response') on conflict(season_id,division_id,player_id) do update set broadcast_id=excluded.broadcast_id,response='pending',selection_status='awaiting_response',responded_at=null returning id into v_invitation_id;
  return v_invitation_id;
end;
$$;

grant execute on function public.get_invitation_rules(uuid) to authenticated;
grant execute on function public.get_player_rule_acknowledgments() to authenticated;
grant execute on function public.acknowledge_rules_and_join(uuid,uuid) to authenticated;
grant execute on function public.prepare_division_join_from_link(uuid) to authenticated;
