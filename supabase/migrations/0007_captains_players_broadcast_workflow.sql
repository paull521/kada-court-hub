-- Final guided order: Season -> Division -> Teams -> Captains -> Players -> Broadcast.
-- Safe to run after 0001 through 0006.

alter table public.seasons drop constraint if exists seasons_setup_stage_check;
alter table public.seasons add constraint seasons_setup_stage_check check (setup_stage between 1 and 6);
alter table public.seasons add column if not exists canceled_at timestamptz;
alter table public.seasons add column if not exists cancellation_reason text;

create table if not exists public.season_broadcasts (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  message text not null check (char_length(message) between 1 and 1000),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists season_broadcasts_season_created_idx on public.season_broadcasts(season_id, created_at desc);
alter table public.season_broadcasts enable row level security;
grant select on public.season_broadcasts to authenticated;
drop policy if exists "Members view season broadcasts" on public.season_broadcasts;
create policy "Members view season broadcasts" on public.season_broadcasts for select to authenticated
  using (exists (
    select 1 from public.seasons season
    where season.id = season_id and public.user_belongs_to_conference(season.conference_id)
  ));

create table if not exists public.season_invitations (
  id uuid primary key default gen_random_uuid(),
  broadcast_id uuid not null references public.season_broadcasts(id) on delete cascade,
  season_id uuid not null references public.seasons(id) on delete cascade,
  player_id uuid not null references public.player_profiles(id) on delete cascade,
  registration_id uuid not null references public.registrations(id) on delete cascade,
  response text not null default 'pending' check (response in ('pending', 'joining', 'not_joining')),
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (season_id, player_id)
);
create index if not exists season_invitations_player_idx on public.season_invitations(player_id, created_at desc);
alter table public.season_invitations enable row level security;
grant select on public.season_invitations to authenticated;
drop policy if exists "Players and owners view season invitations" on public.season_invitations;
create policy "Players and owners view season invitations" on public.season_invitations for select to authenticated
  using (
    exists (select 1 from public.player_profiles player where player.id = player_id and player.profile_id = (select auth.uid()))
    or exists (
      select 1 from public.seasons season
      where season.id = season_id and public.user_has_conference_role(season.conference_id, array['owner']::public.conference_role[])
    )
  );

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  notification_type text not null,
  title text not null,
  body text not null,
  link_path text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (profile_id, notification_type, entity_id)
);
create index if not exists notifications_profile_created_idx on public.notifications(profile_id, created_at desc);
alter table public.notifications enable row level security;
grant select on public.notifications to authenticated;
drop policy if exists "Users view own notifications" on public.notifications;
create policy "Users view own notifications" on public.notifications for select to authenticated
  using (profile_id = (select auth.uid()));

create or replace function public.owner_add_team_leader(
  p_team_id uuid,
  p_role text,
  p_public_player_id text default null,
  p_display_name text default null,
  p_email text default null,
  p_mobile text default null,
  p_jersey_number integer default null,
  p_position text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conference_id uuid;
  v_registration_id uuid;
  v_public_id text := nullif(trim(p_public_player_id), '');
  v_name text := nullif(trim(p_display_name), '');
begin
  select season.conference_id into v_conference_id
  from public.teams team
  join public.divisions division on division.id = team.division_id
  join public.seasons season on season.id = division.season_id
  where team.id = p_team_id;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id, array['owner']::public.conference_role[]) then
    raise exception 'Only a conference owner can assign team leaders.';
  end if;
  if p_role not in ('Captain', 'Co-captain') then raise exception 'Choose Captain or Co-captain.'; end if;
  if v_public_id is null and v_name is null then raise exception 'Enter a KCH Player ID or a player name.'; end if;

  if v_public_id is not null then
    v_registration_id := public.owner_add_existing_player(p_team_id, v_public_id, p_jersey_number, p_position);
  else
    v_registration_id := public.owner_add_roster_player(p_team_id, v_name, p_email, p_mobile, p_jersey_number, p_position);
  end if;
  update public.registrations set role_label = 'Player'
  where team_id = p_team_id and role_label = p_role and id <> v_registration_id;
  update public.registrations set role_label = p_role, status = 'active' where id = v_registration_id;
  insert into public.activity_log (conference_id, actor_profile_id, action, entity_type, entity_id, summary)
  values (v_conference_id, (select auth.uid()), 'update', 'team_leadership', p_team_id::text, 'Assigned ' || p_role);
  return v_registration_id;
end;
$$;

create or replace function public.owner_advance_season_setup(p_season_id uuid, p_expected_stage integer)
returns smallint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conference_id uuid;
  v_current_stage smallint;
begin
  select conference_id, setup_stage into v_conference_id, v_current_stage
  from public.seasons where id = p_season_id for update;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id, array['owner']::public.conference_role[]) then
    raise exception 'Only a conference owner can advance season setup.';
  end if;
  if v_current_stage <> p_expected_stage then raise exception 'This setup step was already completed. Refresh the page.'; end if;
  if v_current_stage >= 5 then raise exception 'Use Broadcast to All to finish this season setup.'; end if;

  if v_current_stage = 1 and not exists (select 1 from public.divisions where season_id = p_season_id) then
    raise exception 'Add at least one division before continuing.';
  elsif v_current_stage = 2 and not exists (
    select 1 from public.teams team join public.divisions division on division.id = team.division_id
    where division.season_id = p_season_id
  ) then raise exception 'Add at least one team before continuing.';
  elsif v_current_stage = 3 and exists (
    select 1 from public.teams team
    join public.divisions division on division.id = team.division_id
    where division.season_id = p_season_id and team.active
      and not exists (
        select 1 from public.registrations registration
        where registration.team_id = team.id and registration.status = 'active' and registration.role_label = 'Captain'
      )
  ) then raise exception 'Assign a captain to every active team before continuing.';
  elsif v_current_stage = 4 and not exists (
    select 1 from public.registrations where season_id = p_season_id and status = 'active'
  ) then raise exception 'Add active players before continuing.';
  end if;

  update public.seasons set setup_stage = setup_stage + 1 where id = p_season_id returning setup_stage into v_current_stage;
  insert into public.activity_log (conference_id, actor_profile_id, action, entity_type, entity_id, summary)
  values (v_conference_id, (select auth.uid()), 'update', 'season_setup', p_season_id::text, 'Advanced guided setup to step ' || v_current_stage);
  return v_current_stage;
end;
$$;

create or replace function public.owner_broadcast_season(p_season_id uuid, p_message text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conference_id uuid;
  v_stage smallint;
  v_message text := nullif(trim(p_message), '');
  v_broadcast_id uuid;
begin
  select conference_id, setup_stage into v_conference_id, v_stage
  from public.seasons where id = p_season_id for update;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id, array['owner']::public.conference_role[]) then
    raise exception 'Only a conference owner can publish a season.';
  end if;
  if v_stage <> 5 then raise exception 'Complete the earlier setup steps before broadcasting.'; end if;
  if v_message is null or char_length(v_message) > 1000 then raise exception 'Enter a broadcast message of 1 to 1000 characters.'; end if;

  insert into public.season_broadcasts (season_id, message, created_by)
  values (p_season_id, v_message, (select auth.uid())) returning id into v_broadcast_id;
  if not exists (select 1 from public.registrations where season_id = p_season_id) then
    raise exception 'Add players before broadcasting this season.';
  end if;
  insert into public.season_invitations (broadcast_id, season_id, player_id, registration_id, response, responded_at)
  select v_broadcast_id, p_season_id, registration.player_id, registration.id, 'pending', null
  from public.registrations registration where registration.season_id = p_season_id
  on conflict (season_id, player_id) do update
    set broadcast_id = excluded.broadcast_id, registration_id = excluded.registration_id,
        response = 'pending', responded_at = null, created_at = now();
  update public.registrations set status = 'pending' where season_id = p_season_id;
  insert into public.notifications (profile_id, notification_type, title, body, link_path, entity_id)
  select player.profile_id, 'season_invitation', season.name || ' invitation', v_message, '/home', invitation.id
  from public.season_invitations invitation
  join public.player_profiles player on player.id = invitation.player_id
  join public.seasons season on season.id = invitation.season_id
  where invitation.broadcast_id = v_broadcast_id and player.profile_id is not null
  on conflict (profile_id, notification_type, entity_id) do update
    set title = excluded.title, body = excluded.body, link_path = excluded.link_path, read_at = null, created_at = now();
  update public.seasons set setup_stage = 6, registration_open = true where id = p_season_id;
  insert into public.activity_log (conference_id, actor_profile_id, action, entity_type, entity_id, summary)
  values (v_conference_id, (select auth.uid()), 'create', 'season_broadcast', v_broadcast_id::text, 'Broadcast season setup to all members');
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
begin
  if p_response not in ('joining', 'not_joining') then raise exception 'Choose Joining or Not Joining.'; end if;
  select invitation.registration_id, player.profile_id into v_registration_id, v_profile_id
  from public.season_invitations invitation
  join public.player_profiles player on player.id = invitation.player_id
  where invitation.id = p_invitation_id;
  if v_profile_id is null or v_profile_id <> (select auth.uid()) then
    raise exception 'This season invitation does not belong to the signed-in player.';
  end if;
  update public.season_invitations set response = p_response, responded_at = now() where id = p_invitation_id;
  update public.registrations
  set status = case when p_response = 'joining' then 'active'::public.registration_status else 'inactive'::public.registration_status end
  where id = v_registration_id;
  update public.notifications set read_at = now()
  where profile_id = (select auth.uid()) and notification_type = 'season_invitation' and entity_id = p_invitation_id;
end;
$$;

create or replace function public.owner_cancel_season(p_season_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conference_id uuid;
  v_season_name text;
  v_reason text := nullif(trim(p_reason), '');
begin
  select conference_id, name into v_conference_id, v_season_name
  from public.seasons where id = p_season_id for update;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id, array['owner']::public.conference_role[]) then
    raise exception 'Only a conference owner can cancel a season.';
  end if;
  if v_reason is null or char_length(v_reason) > 500 then raise exception 'Enter a cancellation reason of 1 to 500 characters.'; end if;
  update public.seasons
  set canceled_at = coalesce(canceled_at, now()), cancellation_reason = v_reason,
      registration_open = false, setup_stage = 6
  where id = p_season_id;
  update public.registrations set status = 'inactive' where season_id = p_season_id;
  insert into public.notifications (profile_id, notification_type, title, body, link_path, entity_id)
  select distinct player.profile_id, 'season_canceled', v_season_name || ' canceled', v_reason, '/home', p_season_id
  from public.registrations registration
  join public.player_profiles player on player.id = registration.player_id
  where registration.season_id = p_season_id and player.profile_id is not null
  on conflict (profile_id, notification_type, entity_id) do update
    set title = excluded.title, body = excluded.body, link_path = excluded.link_path, read_at = null, created_at = now();
  insert into public.activity_log (conference_id, actor_profile_id, action, entity_type, entity_id, summary)
  values (v_conference_id, (select auth.uid()), 'cancel', 'season', p_season_id::text, 'Canceled season: ' || v_reason);
end;
$$;

revoke all on function public.owner_add_team_leader(uuid,text,text,text,text,text,integer,text) from public;
revoke all on function public.owner_broadcast_season(uuid,text) from public;
revoke all on function public.respond_to_season_invitation(uuid,text) from public;
revoke all on function public.owner_cancel_season(uuid,text) from public;
grant execute on function public.owner_add_team_leader(uuid,text,text,text,text,text,integer,text) to authenticated;
grant execute on function public.owner_broadcast_season(uuid,text) to authenticated;
grant execute on function public.respond_to_season_invitation(uuid,text) to authenticated;
grant execute on function public.owner_cancel_season(uuid,text) to authenticated;
