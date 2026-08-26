-- A Commissioner can share one private invitation link for their conference.
-- Claiming the link adds a player only to that conference directory; it does not
-- enroll the player in any season, division, team, or payment obligation.
create table if not exists public.conference_player_invitation_links (
  conference_id uuid primary key references public.conferences(id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.conference_player_invitation_links enable row level security;

create or replace function public.owner_get_conference_player_invitation_token(p_conference_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_token uuid;
begin
  if p_conference_id is null or not public.user_has_conference_role(p_conference_id,array['owner']::public.conference_role[]) then
    raise exception 'Only this conference commissioner can access its player invitation.';
  end if;
  insert into public.conference_player_invitation_links(conference_id,created_by)
  values(p_conference_id,(select auth.uid())) on conflict(conference_id) do nothing;
  select token into v_token from public.conference_player_invitation_links where conference_id=p_conference_id;
  return v_token;
end;
$$;

create or replace function public.get_conference_player_invitation(p_token uuid)
returns table(conference_name text) language sql security definer set search_path='' as $$
  select conference.name
  from public.conference_player_invitation_links invitation
  join public.conferences conference on conference.id=invitation.conference_id
  where invitation.token=p_token
$$;

create or replace function public.claim_conference_player_invitation(p_token uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_conference_id uuid; v_player_id uuid;
begin
  select conference_id into v_conference_id from public.conference_player_invitation_links where token=p_token;
  if v_conference_id is null then raise exception 'This conference invitation is not available.'; end if;
  select id into v_player_id from public.player_profiles where profile_id=(select auth.uid());
  if v_player_id is null then raise exception 'Create your KCH profile before joining this conference.'; end if;
  insert into public.conference_player_pool(conference_id,player_id) values(v_conference_id,v_player_id) on conflict(conference_id,player_id) do nothing;
  insert into public.conference_memberships(conference_id,profile_id,role) values(v_conference_id,(select auth.uid()),'player'::public.conference_role) on conflict(conference_id,profile_id,role) do nothing;
  insert into public.activity_log(conference_id,actor_profile_id,action,entity_type,entity_id,summary) values(v_conference_id,(select auth.uid()),'join','conference_player',v_player_id::text,'Joined the conference player directory');
  return v_conference_id;
end;
$$;

revoke all on function public.owner_get_conference_player_invitation_token(uuid) from public;
revoke all on function public.get_conference_player_invitation(uuid) from public;
revoke all on function public.claim_conference_player_invitation(uuid) from public;
grant execute on function public.owner_get_conference_player_invitation_token(uuid) to authenticated;
grant execute on function public.get_conference_player_invitation(uuid) to anon,authenticated;
grant execute on function public.claim_conference_player_invitation(uuid) to authenticated;
