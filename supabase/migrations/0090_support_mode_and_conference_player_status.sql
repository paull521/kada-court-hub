-- Conference-scoped player status and read-only Platform Support access.

alter table public.conference_player_pool
  add column if not exists status text not null default 'active'
  check(status in ('active','suspended','inactive')),
  add column if not exists updated_at timestamptz not null default now();

-- Existing directory members and historical registrations remain active by default.
insert into public.conference_player_pool(conference_id,player_id,status)
select season.conference_id,registration.player_id,'active'
from public.registrations registration
join public.seasons season on season.id=registration.season_id
on conflict(conference_id,player_id) do nothing;

create or replace function public.owner_set_conference_player_status(
  p_conference_id uuid,
  p_player_id uuid,
  p_status text
)
returns void language plpgsql security definer set search_path='' as $$
declare v_previous text;
begin
  if p_status not in ('active','suspended','inactive') then
    raise exception 'Choose Active, Suspended, or Inactive.';
  end if;
  if not public.user_has_conference_role(p_conference_id,array['owner']::public.conference_role[]) then
    raise exception 'Only this conference owner can update player status.';
  end if;
  select status into v_previous
  from public.conference_player_pool
  where conference_id=p_conference_id and player_id=p_player_id
  for update;
  if v_previous is null then
    raise exception 'Player was not found in this conference directory.';
  end if;
  update public.conference_player_pool
  set status=p_status,updated_at=now()
  where conference_id=p_conference_id and player_id=p_player_id;
  insert into public.activity_log(conference_id,actor_profile_id,action,entity_type,entity_id,summary)
  values(p_conference_id,(select auth.uid()),'update','conference_player_status',p_player_id::text,
    'Changed player status from '||v_previous||' to '||p_status);
end;
$$;

create or replace function public.require_active_conference_player_invitation()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_conference_id uuid;
begin
  select conference_id into v_conference_id from public.seasons where id=new.season_id;
  if not exists(
    select 1 from public.conference_player_pool
    where conference_id=v_conference_id and player_id=new.player_id and status='active'
  ) then
    raise exception 'Only Active conference players can receive a new invitation.';
  end if;
  return new;
end;
$$;

drop trigger if exists require_active_conference_player_invitation on public.season_invitations;
create trigger require_active_conference_player_invitation
before insert or update of season_id,player_id on public.season_invitations
for each row execute function public.require_active_conference_player_invitation();

create or replace function public.get_my_conference_player_statuses()
returns table(conference_id uuid,status text) language sql stable security definer set search_path='' as $$
  select pool.conference_id,pool.status
  from public.conference_player_pool pool
  join public.player_profiles player on player.id=pool.player_id
  where player.profile_id=(select auth.uid());
$$;

create or replace function public.platform_support_conference_snapshot(p_conference_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_conference public.conferences%rowtype;
begin
  if not public.is_platform_creator() then
    raise exception 'Platform Creator access is required.';
  end if;
  select * into v_conference from public.conferences where id=p_conference_id;
  if v_conference.id is null then
    raise exception 'Conference was not found.';
  end if;
  return jsonb_build_object(
    'conferenceId',v_conference.id,
    'conferenceName',v_conference.name,
    'timezone',v_conference.timezone,
    'owners',coalesce((
      select jsonb_agg(jsonb_build_object(
        'name',coalesce(record.full_name,profile.display_name,'Conference Owner'),
        'email',coalesce(record.email,''),'phone',coalesce(record.phone,''),'status',coalesce(record.status,'active')
      ) order by record.created_at)
      from public.platform_owner_records record
      left join public.profiles profile on profile.id=record.profile_id
      where record.conference_id=v_conference.id
    ),'[]'::jsonb),
    'seasons',coalesce((
      select jsonb_agg(jsonb_build_object(
        'name',season.name,'startsOn',season.starts_on,'endsOn',season.ends_on,
        'divisions',(select count(*) from public.divisions division where division.season_id=season.id),
        'teams',(select count(*) from public.teams team join public.divisions division on division.id=team.division_id where division.season_id=season.id),
        'players',(select count(distinct registration.player_id) from public.registrations registration where registration.season_id=season.id and registration.status='active')
      ) order by season.starts_on desc)
      from public.seasons season where season.conference_id=v_conference.id and season.archived_at is null
    ),'[]'::jsonb),
    'players',coalesce((
      select jsonb_agg(jsonb_build_object(
        'name',player.display_name,'publicPlayerId',player.public_player_id,'status',pool.status,
        'divisions',(select count(distinct registration.division_id) from public.registrations registration join public.seasons season on season.id=registration.season_id where registration.player_id=pool.player_id and season.conference_id=v_conference.id)
      ) order by player.display_name)
      from public.conference_player_pool pool
      join public.player_profiles player on player.id=pool.player_id
      where pool.conference_id=v_conference.id
    ),'[]'::jsonb)
  );
end;
$$;

revoke all on function public.owner_set_conference_player_status(uuid,uuid,text),public.get_my_conference_player_statuses(),public.platform_support_conference_snapshot(uuid) from public;
grant execute on function public.owner_set_conference_player_status(uuid,uuid,text),public.get_my_conference_player_statuses(),public.platform_support_conference_snapshot(uuid) to authenticated;
