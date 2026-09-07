-- Shared owner-application link: profiles may be created from the owner page,
-- then the applicant acknowledges the free KCH demo before Creator review.

alter table public.platform_owner_records
  add column if not exists proposed_conference_name text;

create table if not exists public.platform_owner_demo_acknowledgments(
  id uuid primary key default gen_random_uuid(),
  owner_record_id uuid not null unique references public.platform_owner_records(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  acknowledged_at timestamptz not null default now()
);

alter table public.platform_owner_demo_acknowledgments enable row level security;

drop policy if exists "Owners view own demo acknowledgment" on public.platform_owner_demo_acknowledgments;
create policy "Owners view own demo acknowledgment"
on public.platform_owner_demo_acknowledgments for select to authenticated
using(profile_id=(select auth.uid()));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_display_name text;
  v_mobile text;
  v_conference_id uuid;
  v_player_id uuid;
  v_player_token uuid;
  v_owner_token uuid;
  v_owner_application boolean;
begin
  v_display_name := coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1));
  v_mobile := nullif(trim(coalesce(new.raw_user_meta_data ->> 'mobile', '')), '');
  v_owner_application := coalesce((new.raw_user_meta_data ->> 'owner_application')::boolean, false);

  begin
    v_player_token := nullif(new.raw_user_meta_data ->> 'conference_invitation_token', '')::uuid;
  exception when invalid_text_representation then
    raise exception 'KCH profiles can only be created from a valid invitation.';
  end;

  begin
    v_owner_token := nullif(new.raw_user_meta_data ->> 'platform_owner_invitation_token', '')::uuid;
  exception when invalid_text_representation then
    raise exception 'KCH profiles can only be created from a valid invitation.';
  end;

  if v_player_token is null and v_owner_token is null and not v_owner_application then
    raise exception 'KCH profiles can only be created from a valid invitation.';
  end if;

  if v_owner_application and v_mobile is null then
    raise exception 'Enter a mobile number for the owner profile.';
  end if;

  if v_player_token is not null then
    select invitation.conference_id into v_conference_id
    from public.conference_player_invitation_links invitation
    where invitation.token = v_player_token;
    if v_conference_id is null then
      raise exception 'This conference invitation is not available.';
    end if;
  elsif v_owner_token is not null then
    if not exists(
      select 1 from public.platform_owner_invitations invitation
      where invitation.token = v_owner_token
        and invitation.accepted_at is null
        and invitation.expires_at >= now()
    ) then
      raise exception 'This owner invitation is not available.';
    end if;
  end if;

  insert into public.profiles (id, display_name, mobile)
  values (new.id, v_display_name, v_mobile);

  insert into public.player_profiles (profile_id, public_player_id, display_name, email, mobile, claimed_at)
  values (new.id, 'KCH-' || upper(substr(replace(new.id::text, '-', ''), 1, 8)), v_display_name, new.email, v_mobile, now())
  returning id into v_player_id;

  if v_conference_id is not null then
    insert into public.conference_player_pool(conference_id, player_id)
    values (v_conference_id, v_player_id)
    on conflict(conference_id, player_id) do nothing;

    insert into public.conference_memberships(conference_id, profile_id, role)
    values (v_conference_id, new.id, 'player'::public.conference_role)
    on conflict(conference_id, profile_id, role) do nothing;
  end if;

  return new;
end;
$$;

create or replace function public.acknowledge_owner_demo(
  p_owner_id uuid,
  p_conference_name text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if char_length(trim(p_conference_name)) not between 2 and 80 then
    raise exception 'Enter a conference name.';
  end if;
  if not exists(
    select 1 from public.platform_owner_records
    where id=p_owner_id and profile_id=(select auth.uid()) and conference_id is null
  ) then
    raise exception 'This owner application is not available.';
  end if;

  insert into public.platform_owner_demo_acknowledgments(owner_record_id, profile_id)
  values(p_owner_id, (select auth.uid()))
  on conflict(owner_record_id) do update
    set profile_id=excluded.profile_id, acknowledged_at=now();

  update public.platform_owner_records
  set proposed_conference_name=trim(p_conference_name), updated_at=now()
  where id=p_owner_id;
end;
$$;

create or replace function public.platform_create_owner_conference(p_owner_id uuid,p_conference_name text)
returns void language plpgsql security definer set search_path='' as $$
declare r public.platform_owner_records%rowtype; v_conference_id uuid; v_slug text; v_name text;
begin
  if not public.is_platform_creator() then raise exception 'Platform Creator access is required.'; end if;
  select * into r from public.platform_owner_records where id=p_owner_id for update;
  if r.id is null or r.profile_id is null then raise exception 'The owner must complete KCH login first.'; end if;
  if r.conference_id is not null then raise exception 'This owner already has a conference.'; end if;
  if not exists(select 1 from public.platform_owner_demo_acknowledgments where owner_record_id=r.id) then
    raise exception 'The owner must read and acknowledge the demo overview first.';
  end if;
  v_name:=coalesce(nullif(trim(p_conference_name),''), r.proposed_conference_name);
  if char_length(coalesce(v_name,'')) not between 2 and 80 then raise exception 'Enter a conference name.'; end if;
  v_slug:=lower(regexp_replace(v_name,'[^a-zA-Z0-9]+','-','g'))||'-'||substr(replace(gen_random_uuid()::text,'-',''),1,8);
  insert into public.conferences(name,slug) values(v_name,v_slug) returning id into v_conference_id;
  insert into public.conference_subscriptions(conference_id,status,due_on)
  values(v_conference_id,'paused',null);
  insert into public.conference_memberships(conference_id,profile_id,role)
  values(v_conference_id,r.profile_id,'owner') on conflict do nothing;
  update public.platform_owner_records
  set conference_id=v_conference_id,status='active',proposed_conference_name=v_name,
      subscription_starts_on=current_date,subscription_ends_on=null,updated_at=now()
  where id=r.id;
end;
$$;

create or replace function public.platform_owner_operations()
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_owners jsonb;v_candidates jsonb;v_directory jsonb;v_support jsonb;v_feedback jsonb;
begin
  if not public.is_platform_creator() then return jsonb_build_object('authorized',false); end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',record.id,'conferenceId',record.conference_id,'conferenceName',conference.name,
    'proposedConferenceName',record.proposed_conference_name,'name',record.full_name,'email',record.email,
    'phone',record.phone,'status',record.status,'subscriptionStartsOn',record.subscription_starts_on,
    'subscriptionEndsOn',record.subscription_ends_on,'demoAcknowledgedAt',demo.acknowledged_at
  ) order by record.created_at desc),'[]'::jsonb)
  into v_owners
  from public.platform_owner_records record
  join public.conferences conference on conference.id=record.conference_id
  left join public.platform_owner_demo_acknowledgments demo on demo.owner_record_id=record.id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',record.id,'name',record.full_name,'email',record.email,'phone',record.phone,
    'proposedConferenceName',record.proposed_conference_name,'demoAcknowledgedAt',demo.acknowledged_at
  ) order by demo.acknowledged_at desc),'[]'::jsonb)
  into v_candidates
  from public.platform_owner_records record
  join public.platform_owner_demo_acknowledgments demo on demo.owner_record_id=record.id
  where record.conference_id is null;

  select coalesce(jsonb_agg(jsonb_build_object('conference',conference.name,'activeDivisions',active_divisions.count,'inactiveDivisions',inactive_divisions.count,'activePlayers',active_players.count,'inactivePlayers',inactive_players.count) order by conference.name),'[]'::jsonb) into v_directory from public.conferences conference left join lateral(select count(*) from public.divisions division join public.seasons season on season.id=division.season_id where season.conference_id=conference.id and season.canceled_at is null and season.ends_on>=current_date) active_divisions(count) on true left join lateral(select count(*) from public.divisions division join public.seasons season on season.id=division.season_id where season.conference_id=conference.id and(season.canceled_at is not null or season.ends_on<current_date)) inactive_divisions(count) on true left join lateral(select count(distinct registration.player_id) from public.registrations registration join public.seasons season on season.id=registration.season_id where season.conference_id=conference.id and registration.status='active' and season.canceled_at is null and season.starts_on<=current_date and season.ends_on>=current_date) active_players(count) on true left join lateral(select count(distinct registration.player_id) from public.registrations registration join public.seasons season on season.id=registration.season_id where season.conference_id=conference.id and (registration.status<>'active' or season.canceled_at is not null or season.ends_on<current_date)) inactive_players(count) on true where coalesce(conference.is_test,false)=false;
  select coalesce(jsonb_agg(jsonb_build_object('id',request.id,'conferenceName',conference.name,'ownerName',profile.display_name,'subject',request.subject,'message',request.message,'status',request.status,'createdAt',request.created_at) order by request.created_at desc),'[]'::jsonb) into v_support from public.platform_support_requests request join public.conferences conference on conference.id=request.conference_id join public.profiles profile on profile.id=request.requested_by;
  select coalesce(jsonb_agg(jsonb_build_object('id',feedback.id,'conferenceName',conference.name,'playerName',profile.display_name,'message',feedback.message,'createdAt',feedback.created_at) order by feedback.created_at desc),'[]'::jsonb) into v_feedback from public.platform_feedback feedback join public.conferences conference on conference.id=feedback.conference_id join public.profiles profile on profile.id=feedback.submitted_by;
  return jsonb_build_object('authorized',true,'owners',v_owners,'candidates',v_candidates,'directory',v_directory,'support',v_support,'feedback',v_feedback);
end;
$$;

create or replace function public.get_owner_demo_acknowledgment()
returns table(acknowledged_at timestamptz)
language sql stable security definer set search_path='' as $$
  select demo.acknowledged_at
  from public.platform_owner_demo_acknowledgments demo
  join public.platform_owner_records record on record.id=demo.owner_record_id
  where record.profile_id=(select auth.uid()) and record.status='active'
  order by demo.acknowledged_at desc
  limit 1;
$$;

revoke all on function public.acknowledge_owner_demo(uuid,text),public.get_owner_demo_acknowledgment() from public;
grant execute on function public.acknowledge_owner_demo(uuid,text),public.get_owner_demo_acknowledgment() to authenticated;
