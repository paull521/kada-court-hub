-- Step 7 handoff: owners run the draft, captains enter team rosters, owners approve.

create table if not exists public.team_roster_drafts (
  team_id uuid primary key references public.teams(id) on delete cascade,
  status text not null default 'editing' check (status in ('editing','submitted','approved','changes_requested')),
  submitted_at timestamptz,
  submitted_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  owner_note text check (owner_note is null or char_length(owner_note) <= 1000),
  updated_at timestamptz not null default now()
);

alter table public.team_roster_drafts enable row level security;
grant select on public.team_roster_drafts to authenticated;
drop policy if exists "Owners and team leaders view roster drafts" on public.team_roster_drafts;
create policy "Owners and team leaders view roster drafts" on public.team_roster_drafts for select to authenticated
using (
  public.user_manages_team(team_roster_drafts.team_id)
  or exists (
    select 1 from public.registrations registration
    join public.player_profiles player on player.id=registration.player_id
    where registration.team_id=team_roster_drafts.team_id
      and player.profile_id=(select auth.uid())
      and registration.role_label in ('Captain','Co-captain')
  )
);

create or replace function public.captain_draft_candidates(p_team_id uuid)
returns table(invitation_id uuid,registration_id uuid,public_player_id text,display_name text,selection_status text)
language plpgsql security definer set search_path=''
as $$
declare v_division_id uuid;
begin
  select team.division_id into v_division_id from public.teams team where team.id=p_team_id;
  if v_division_id is null or not exists(
    select 1 from public.registrations registration
    join public.player_profiles player on player.id=registration.player_id
    where registration.team_id=p_team_id and player.profile_id=(select auth.uid())
      and registration.role_label in ('Captain','Co-captain')
  ) then raise exception 'Captain access is required for this team.'; end if;
  return query
  select invitation.id,invitation.registration_id,player.public_player_id,player.display_name,invitation.selection_status
  from public.season_invitations invitation
  join public.player_profiles player on player.id=invitation.player_id
  left join public.registrations registration on registration.id=invitation.registration_id
  where invitation.division_id=v_division_id and invitation.response='joining'
    and invitation.selection_status in ('eligible','waitlisted')
    and (registration.team_id is null or registration.team_id=p_team_id)
  order by case invitation.selection_status when 'eligible' then 0 else 1 end, invitation.responded_at, player.display_name;
end;
$$;

create or replace function public.captain_save_draft_player(p_team_id uuid,p_invitation_id uuid,p_jersey_number integer default null,p_position text default null)
returns void language plpgsql security definer set search_path=''
as $$
declare v_division_id uuid;v_registration_id uuid;v_player_id uuid;v_status text;v_position text:=nullif(trim(p_position),'');
begin
  select team.division_id into v_division_id from public.teams team where team.id=p_team_id;
  if v_division_id is null or not exists(
    select 1 from public.registrations registration join public.player_profiles player on player.id=registration.player_id
    where registration.team_id=p_team_id and player.profile_id=(select auth.uid()) and registration.role_label in ('Captain','Co-captain')
  ) then raise exception 'Captain access is required for this team.'; end if;
  select coalesce(draft.status,'editing') into v_status from public.teams team left join public.team_roster_drafts draft on draft.team_id=team.id where team.id=p_team_id;
  if v_status in ('submitted','approved') then raise exception 'This roster is locked while it is under owner review.'; end if;
  select invitation.registration_id,invitation.player_id into v_registration_id,v_player_id
  from public.season_invitations invitation where invitation.id=p_invitation_id and invitation.division_id=v_division_id
    and invitation.response='joining' and invitation.selection_status in ('eligible','waitlisted');
  if v_registration_id is null then raise exception 'Choose a player from this division draft list.'; end if;
  if p_jersey_number is not null and (p_jersey_number<0 or p_jersey_number>99) then raise exception 'Jersey number must be from 0 to 99.'; end if;
  if v_position is not null and char_length(v_position)>40 then raise exception 'Enter a shorter position.'; end if;
  if p_jersey_number is not null and exists(select 1 from public.registrations where team_id=p_team_id and jersey_number=p_jersey_number and id<>v_registration_id) then raise exception 'That jersey number is already used on this team.'; end if;
  update public.registrations set team_id=p_team_id,jersey_number=p_jersey_number,position=v_position,status='pending' where id=v_registration_id;
  insert into public.team_roster_drafts(team_id,status,updated_at) values(p_team_id,'editing',now())
  on conflict(team_id) do update set status='editing',submitted_at=null,submitted_by=null,reviewed_at=null,reviewed_by=null,owner_note=null,updated_at=now();
end;
$$;

create or replace function public.captain_update_draft_player(p_team_id uuid,p_registration_id uuid,p_jersey_number integer default null,p_position text default null,p_remove boolean default false)
returns void language plpgsql security definer set search_path=''
as $$
declare v_status text;v_position text:=nullif(trim(p_position),'');
begin
  if not exists(select 1 from public.registrations registration join public.player_profiles player on player.id=registration.player_id where registration.team_id=p_team_id and player.profile_id=(select auth.uid()) and registration.role_label in ('Captain','Co-captain')) then raise exception 'Captain access is required for this team.'; end if;
  select coalesce(draft.status,'editing') into v_status from public.teams team left join public.team_roster_drafts draft on draft.team_id=team.id where team.id=p_team_id;
  if v_status in ('submitted','approved') then raise exception 'This roster is locked while it is under owner review.'; end if;
  if not exists(select 1 from public.registrations where id=p_registration_id and team_id=p_team_id and role_label='Player') then raise exception 'Choose a drafted player on your team.'; end if;
  if p_remove then update public.registrations set team_id=null,jersey_number=null,position=null where id=p_registration_id;
  else
    if p_jersey_number is not null and (p_jersey_number<0 or p_jersey_number>99) then raise exception 'Jersey number must be from 0 to 99.'; end if;
    if p_jersey_number is not null and exists(select 1 from public.registrations where team_id=p_team_id and jersey_number=p_jersey_number and id<>p_registration_id) then raise exception 'That jersey number is already used on this team.'; end if;
    update public.registrations set jersey_number=p_jersey_number,position=v_position where id=p_registration_id;
  end if;
  insert into public.team_roster_drafts(team_id,status,updated_at) values(p_team_id,'editing',now()) on conflict(team_id) do update set status='editing',updated_at=now();
end;
$$;

create or replace function public.captain_submit_team_roster(p_team_id uuid)
returns void language plpgsql security definer set search_path=''
as $$
begin
  if not exists(select 1 from public.registrations registration join public.player_profiles player on player.id=registration.player_id where registration.team_id=p_team_id and player.profile_id=(select auth.uid()) and registration.role_label in ('Captain','Co-captain')) then raise exception 'Captain access is required for this team.'; end if;
  if not exists(select 1 from public.registrations where team_id=p_team_id and role_label='Player') then raise exception 'Add the drafted players before submitting your roster.'; end if;
  insert into public.team_roster_drafts(team_id,status,submitted_at,submitted_by,updated_at) values(p_team_id,'submitted',now(),(select auth.uid()),now())
  on conflict(team_id) do update set status='submitted',submitted_at=now(),submitted_by=(select auth.uid()),owner_note=null,updated_at=now();
end;
$$;

create or replace function public.owner_review_team_roster(p_team_id uuid,p_decision text,p_owner_note text default null)
returns void language plpgsql security definer set search_path=''
as $$
declare v_conference_id uuid;v_status text;
begin
  if p_decision not in ('approved','changes_requested') then raise exception 'Choose Approve or Request Changes.'; end if;
  select season.conference_id,draft.status into v_conference_id,v_status from public.teams team join public.divisions division on division.id=team.division_id join public.seasons season on season.id=division.season_id left join public.team_roster_drafts draft on draft.team_id=team.id where team.id=p_team_id;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then raise exception 'Only the conference owner can review this roster.'; end if;
  if v_status<>'submitted' then raise exception 'The captain must submit this roster first.'; end if;
  if p_decision='changes_requested' and nullif(trim(p_owner_note),'') is null then raise exception 'Explain the requested changes.'; end if;
  update public.team_roster_drafts set status=p_decision,owner_note=nullif(trim(p_owner_note),''),reviewed_at=now(),reviewed_by=(select auth.uid()),updated_at=now() where team_id=p_team_id;
end;
$$;

create or replace function public.owner_publish_roster_draft(p_season_id uuid,p_message text)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_conference_id uuid;v_season_name text;v_message text:=nullif(trim(p_message),'');v_broadcast_id uuid;
begin
  select conference_id,name into v_conference_id,v_season_name from public.seasons where id=p_season_id for update;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then raise exception 'Only a conference owner can publish roster drafts.'; end if;
  if v_message is null or char_length(v_message)>1000 then raise exception 'Enter a roster message of 1 to 1000 characters.'; end if;
  if exists(select 1 from public.teams team join public.divisions division on division.id=team.division_id left join public.team_roster_drafts draft on draft.team_id=team.id where division.season_id=p_season_id and team.active and coalesce(draft.status,'editing')<>'approved') then raise exception 'Approve every captain roster before publishing.'; end if;
  if exists(select 1 from public.season_invitations invitation left join public.registrations registration on registration.id=invitation.registration_id where invitation.season_id=p_season_id and invitation.selection_status='eligible' and registration.team_id is null) then raise exception 'Every draft-pool player must be assigned before publishing.'; end if;
  insert into public.season_broadcasts(season_id,message,created_by,broadcast_type) values(p_season_id,v_message,(select auth.uid()),'roster_draft') returning id into v_broadcast_id;
  update public.registrations set status='active' where season_id=p_season_id and team_id is not null;
  update public.seasons set setup_stage=6,registration_open=false where id=p_season_id;
  insert into public.notifications(profile_id,notification_type,title,body,link_path,entity_id)
  select distinct player.profile_id,'roster_draft_published',v_season_name||' roster draft',v_message,'/my-team',v_broadcast_id from public.registrations registration join public.player_profiles player on player.id=registration.player_id where registration.season_id=p_season_id and player.profile_id is not null;
  return v_broadcast_id;
end;
$$;

revoke all on function public.captain_draft_candidates(uuid) from public;
revoke all on function public.captain_save_draft_player(uuid,uuid,integer,text) from public;
revoke all on function public.captain_update_draft_player(uuid,uuid,integer,text,boolean) from public;
revoke all on function public.captain_submit_team_roster(uuid) from public;
revoke all on function public.owner_review_team_roster(uuid,text,text) from public;
grant execute on function public.captain_draft_candidates(uuid) to authenticated;
grant execute on function public.captain_save_draft_player(uuid,uuid,integer,text) to authenticated;
grant execute on function public.captain_update_draft_player(uuid,uuid,integer,text,boolean) to authenticated;
grant execute on function public.captain_submit_team_roster(uuid) to authenticated;
grant execute on function public.owner_review_team_roster(uuid,text,text) to authenticated;

alter table public.roster_change_requests add column if not exists reviewed_by uuid references public.profiles(id);
alter table public.roster_change_requests add column if not exists owner_note text;

create or replace function public.owner_review_roster_change_request(p_request_id uuid,p_decision text,p_owner_note text default null)
returns void language plpgsql security definer set search_path=''
as $$
declare v_conference_id uuid;v_requested_by uuid;v_team_name text;v_note text:=nullif(trim(p_owner_note),'');
begin
  if p_decision not in ('approved','declined') then raise exception 'Choose Approve or Decline.'; end if;
  select season.conference_id,request.requested_by,team.name into v_conference_id,v_requested_by,v_team_name
  from public.roster_change_requests request join public.seasons season on season.id=request.season_id join public.teams team on team.id=request.team_id
  where request.id=p_request_id and request.status='pending';
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then raise exception 'Only the conference owner can review this pending request.'; end if;
  if p_decision='declined' and v_note is null then raise exception 'Explain why the request was declined.'; end if;
  update public.roster_change_requests set status=p_decision,owner_note=v_note,reviewed_by=(select auth.uid()),resolved_at=now() where id=p_request_id;
  insert into public.notifications(profile_id,notification_type,title,body,link_path,entity_id)
  values(v_requested_by,'roster_request_reviewed',v_team_name||' roster request '||p_decision,coalesce(v_note,'The conference owner approved your request.'),'/captain',p_request_id)
  on conflict(profile_id,notification_type,entity_id) do update set title=excluded.title,body=excluded.body,read_at=null,created_at=now();
end;
$$;

revoke all on function public.owner_review_roster_change_request(uuid,text,text) from public;
grant execute on function public.owner_review_roster_change_request(uuid,text,text) to authenticated;
