-- Corrected workflow: captains -> invite conference players -> draft -> publish rosters.
-- Safe to run after 0001 through 0007.

alter table public.season_broadcasts add column if not exists broadcast_type text not null default 'player_invitation';
alter table public.season_broadcasts add column if not exists response_deadline date;
alter table public.season_broadcasts add column if not exists invited_count integer not null default 0;
alter table public.season_broadcasts add column if not exists flyer_path text;
alter table public.season_broadcasts add column if not exists team_count integer;
alter table public.season_broadcasts add column if not exists players_per_team integer;
alter table public.season_invitations alter column registration_id drop not null;
alter table public.seasons add column if not exists players_per_team integer;
alter table public.seasons drop constraint if exists seasons_players_per_team_check;
alter table public.seasons add constraint seasons_players_per_team_check check (players_per_team is null or players_per_team between 1 and 30);

create table if not exists public.roster_change_requests (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  requested_by uuid not null references public.profiles(id),
  request_type text not null check (request_type in ('player_update', 'trade', 'add_player', 'remove_player', 'other')),
  details text not null check (char_length(details) between 1 and 1000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined', 'completed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists roster_change_requests_team_idx on public.roster_change_requests(team_id, created_at desc);
alter table public.roster_change_requests enable row level security;
grant select on public.roster_change_requests to authenticated;
drop policy if exists "Captains and owners view roster requests" on public.roster_change_requests;
create policy "Captains and owners view roster requests" on public.roster_change_requests for select to authenticated
  using (
    public.user_manages_team(roster_change_requests.team_id)
    or exists (
      select 1 from public.registrations registration
      join public.player_profiles player on player.id = registration.player_id
      where registration.team_id = roster_change_requests.team_id and player.profile_id = (select auth.uid())
        and registration.role_label in ('Captain', 'Co-captain')
    )
    or exists (
      select 1 from public.seasons season
      where season.id = roster_change_requests.season_id and public.user_has_conference_role(season.conference_id, array['owner']::public.conference_role[])
    )
  );

create or replace function public.owner_invite_conference_players(
  p_season_id uuid,
  p_message text,
  p_response_deadline date,
  p_players_per_team integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conference_id uuid;
  v_season_name text;
  v_stage smallint;
  v_message text := nullif(trim(p_message), '');
  v_broadcast_id uuid;
  v_invited_count integer;
  v_team_count integer;
begin
  select conference_id, name, setup_stage into v_conference_id, v_season_name, v_stage
  from public.seasons where id = p_season_id for update;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id, array['owner']::public.conference_role[]) then
    raise exception 'Only a conference owner can invite players.';
  end if;
  if v_stage <> 4 then raise exception 'Complete the captain step before inviting players.'; end if;
  if v_message is null or char_length(v_message) > 1000 then raise exception 'Enter an invitation message of 1 to 1000 characters.'; end if;
  if p_response_deadline < current_date then raise exception 'The response deadline cannot be in the past.'; end if;
  if p_players_per_team < 1 or p_players_per_team > 30 then raise exception 'Players per team must be from 1 to 30.'; end if;
  select count(*) into v_team_count
  from public.teams team join public.divisions division on division.id = team.division_id
  where division.season_id = p_season_id and team.active;

  insert into public.season_broadcasts (season_id, message, created_by, broadcast_type, response_deadline, team_count, players_per_team)
  values (p_season_id, v_message, (select auth.uid()), 'player_invitation', p_response_deadline, v_team_count, p_players_per_team) returning id into v_broadcast_id;

  insert into public.season_invitations (broadcast_id, season_id, player_id, registration_id, response, responded_at)
  select distinct v_broadcast_id, p_season_id, candidate.player_id, null, 'pending', null
  from (
    select player.id as player_id
    from public.conference_memberships membership
    join public.player_profiles player on player.profile_id = membership.profile_id
    where membership.conference_id = v_conference_id and membership.role = 'player'
    union
    select registration.player_id
    from public.registrations registration
    join public.seasons prior_season on prior_season.id = registration.season_id
    where prior_season.conference_id = v_conference_id
  ) candidate
  where not exists (
    select 1 from public.registrations current_registration
    where current_registration.season_id = p_season_id and current_registration.player_id = candidate.player_id
  )
  on conflict (season_id, player_id) do update
    set broadcast_id = excluded.broadcast_id, response = 'pending', responded_at = null, created_at = now();

  select count(*) into v_invited_count from public.season_invitations where broadcast_id = v_broadcast_id;
  update public.season_broadcasts set invited_count = v_invited_count where id = v_broadcast_id;
  update public.seasons set setup_stage = 5, players_per_team = p_players_per_team where id = p_season_id;

  insert into public.notifications (profile_id, notification_type, title, body, link_path, entity_id)
  select player.profile_id, 'season_invitation', v_season_name || ' invitation', v_message, '/home', invitation.id
  from public.season_invitations invitation
  join public.player_profiles player on player.id = invitation.player_id
  where invitation.broadcast_id = v_broadcast_id and player.profile_id is not null
  on conflict (profile_id, notification_type, entity_id) do update
    set title = excluded.title, body = excluded.body, link_path = excluded.link_path, read_at = null, created_at = now();

  insert into public.activity_log (conference_id, actor_profile_id, action, entity_type, entity_id, summary)
  values (v_conference_id, (select auth.uid()), 'create', 'player_invitation', v_broadcast_id::text, 'Invited conference players to join ' || v_season_name);
  return v_broadcast_id;
end;
$$;

create or replace function public.respond_to_season_invitation(p_invitation_id uuid, p_response text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_registration_id uuid;
  v_profile_id uuid;
  v_player_id uuid;
  v_season_id uuid;
begin
  if p_response not in ('joining', 'not_joining') then raise exception 'Choose Joining or Not Joining.'; end if;
  select invitation.registration_id, invitation.player_id, invitation.season_id, player.profile_id
  into v_registration_id, v_player_id, v_season_id, v_profile_id
  from public.season_invitations invitation
  join public.player_profiles player on player.id = invitation.player_id
  where invitation.id = p_invitation_id;
  if v_profile_id is null or v_profile_id <> (select auth.uid()) then
    raise exception 'This season invitation does not belong to the signed-in player.';
  end if;
  if exists (
    select 1 from public.season_invitations invitation
    join public.season_broadcasts broadcast on broadcast.id = invitation.broadcast_id
    where invitation.id = p_invitation_id and broadcast.response_deadline is not null and broadcast.response_deadline < current_date
  ) then raise exception 'The response deadline for this invitation has passed.'; end if;

  if p_response = 'joining' then
    insert into public.registrations (player_id, season_id, team_id, status, role_label)
    values (v_player_id, v_season_id, null, 'pending', 'Player')
    on conflict (player_id, season_id) do update set status = 'pending'
    returning id into v_registration_id;
  elsif v_registration_id is not null then
    update public.registrations set status = 'inactive' where id = v_registration_id;
  end if;
  update public.season_invitations
  set response = p_response, responded_at = now(), registration_id = v_registration_id
  where id = p_invitation_id;
  update public.notifications set read_at = now()
  where profile_id = (select auth.uid()) and notification_type = 'season_invitation' and entity_id = p_invitation_id;
end;
$$;

create or replace function public.owner_assign_draft_player(
  p_invitation_id uuid,
  p_team_id uuid,
  p_jersey_number integer default null,
  p_position text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conference_id uuid;
  v_season_id uuid;
  v_registration_id uuid;
  v_position text := nullif(trim(p_position), '');
begin
  select invitation.season_id, invitation.registration_id, season.conference_id
  into v_season_id, v_registration_id, v_conference_id
  from public.season_invitations invitation
  join public.seasons season on season.id = invitation.season_id
  where invitation.id = p_invitation_id and invitation.response = 'joining';
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id, array['owner']::public.conference_role[]) then
    raise exception 'Only a conference owner can draft players.';
  end if;
  if not exists (
    select 1 from public.teams team join public.divisions division on division.id = team.division_id
    where team.id = p_team_id and division.season_id = v_season_id
  ) then raise exception 'Choose a team in this season.'; end if;
  if p_jersey_number is not null and (p_jersey_number < 0 or p_jersey_number > 99) then raise exception 'Jersey number must be from 0 to 99.'; end if;
  if v_position is not null and char_length(v_position) > 40 then raise exception 'Enter a shorter position.'; end if;
  if p_jersey_number is not null and exists (
    select 1 from public.registrations
    where team_id = p_team_id and jersey_number = p_jersey_number and id <> v_registration_id
  ) then raise exception 'That jersey number is already assigned on this team.'; end if;
  update public.registrations
  set team_id = p_team_id, jersey_number = p_jersey_number, position = v_position, status = 'pending'
  where id = v_registration_id;
end;
$$;

create or replace function public.owner_publish_roster_draft(p_season_id uuid, p_message text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conference_id uuid;
  v_season_name text;
  v_stage smallint;
  v_message text := nullif(trim(p_message), '');
  v_broadcast_id uuid;
begin
  select conference_id, name, setup_stage into v_conference_id, v_season_name, v_stage
  from public.seasons where id = p_season_id for update;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id, array['owner']::public.conference_role[]) then
    raise exception 'Only a conference owner can publish roster drafts.';
  end if;
  if v_stage <> 5 then raise exception 'Invite players before publishing the roster draft.'; end if;
  if v_message is null or char_length(v_message) > 1000 then raise exception 'Enter a roster message of 1 to 1000 characters.'; end if;
  if exists (
    select 1 from public.season_invitations invitation
    left join public.registrations registration on registration.id = invitation.registration_id
    where invitation.season_id = p_season_id and invitation.response = 'joining' and registration.team_id is null
  ) then raise exception 'Assign every joining player to a team before completing the draft.'; end if;

  insert into public.season_broadcasts (season_id, message, created_by, broadcast_type)
  values (p_season_id, v_message, (select auth.uid()), 'roster_draft') returning id into v_broadcast_id;
  update public.registrations set status = 'active'
  where season_id = p_season_id and team_id is not null;
  insert into public.notifications (profile_id, notification_type, title, body, link_path, entity_id)
  select distinct player.profile_id, 'roster_draft_published', v_season_name || ' roster draft', v_message, '/my-team', v_broadcast_id
  from public.registrations registration
  join public.player_profiles player on player.id = registration.player_id
  where registration.season_id = p_season_id and player.profile_id is not null
  on conflict (profile_id, notification_type, entity_id) do update
    set title = excluded.title, body = excluded.body, link_path = excluded.link_path, read_at = null, created_at = now();
  update public.seasons set setup_stage = 6, registration_open = false where id = p_season_id;
  insert into public.activity_log (conference_id, actor_profile_id, action, entity_type, entity_id, summary)
  values (v_conference_id, (select auth.uid()), 'publish', 'roster_draft', v_broadcast_id::text, 'Published roster draft for ' || v_season_name);
  return v_broadcast_id;
end;
$$;

create or replace function public.captain_create_roster_request(
  p_team_id uuid,
  p_request_type text,
  p_details text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_season_id uuid;
  v_setup_stage smallint;
  v_request_id uuid;
  v_details text := nullif(trim(p_details), '');
begin
  select division.season_id, season.setup_stage into v_season_id, v_setup_stage
  from public.teams team
  join public.divisions division on division.id = team.division_id
  join public.seasons season on season.id = division.season_id
  where team.id = p_team_id;
  if v_season_id is null or not exists (
    select 1 from public.registrations registration
    join public.player_profiles player on player.id = registration.player_id
    where registration.team_id = p_team_id and player.profile_id = (select auth.uid())
      and registration.role_label in ('Captain', 'Co-captain')
  ) then raise exception 'Only this team''s captain or co-captain can submit roster requests.'; end if;
  if v_setup_stage <> 6 then raise exception 'Roster requests open after the owner publishes the roster draft.'; end if;
  if p_request_type not in ('player_update', 'trade', 'add_player', 'remove_player', 'other') then raise exception 'Choose a valid request type.'; end if;
  if v_details is null or char_length(v_details) > 1000 then raise exception 'Enter request details of 1 to 1000 characters.'; end if;
  insert into public.roster_change_requests (season_id, team_id, requested_by, request_type, details)
  values (v_season_id, p_team_id, (select auth.uid()), p_request_type, v_details)
  returning id into v_request_id;
  return v_request_id;
end;
$$;

revoke all on function public.owner_invite_conference_players(uuid,text,date,integer) from public;
revoke all on function public.owner_assign_draft_player(uuid,uuid,integer,text) from public;
revoke all on function public.owner_publish_roster_draft(uuid,text) from public;
revoke all on function public.captain_create_roster_request(uuid,text,text) from public;
grant execute on function public.owner_invite_conference_players(uuid,text,date,integer) to authenticated;
grant execute on function public.owner_assign_draft_player(uuid,uuid,integer,text) to authenticated;
grant execute on function public.owner_publish_roster_draft(uuid,text) to authenticated;
grant execute on function public.captain_create_roster_request(uuid,text,text) to authenticated;
