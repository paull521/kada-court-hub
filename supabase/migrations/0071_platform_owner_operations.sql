-- Platform Creator operations: owner records, support requests, and read-only reports.
create table if not exists public.platform_owner_records(
  id uuid primary key default gen_random_uuid(),
  conference_id uuid unique references public.conferences(id) on delete set null,
  profile_id uuid unique references public.profiles(id) on delete set null,
  full_name text not null check(char_length(trim(full_name)) between 2 and 100),
  email text not null unique check(char_length(email)<=254),
  phone text not null default '' check(char_length(phone)<=40),
  status text not null default 'invited' check(status in('invited','active','suspended')),
  subscription_starts_on date,
  subscription_ends_on date,
  contract_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.platform_owner_invitations add column if not exists owner_record_id uuid references public.platform_owner_records(id) on delete set null;
alter table public.conference_subscriptions add column if not exists requested_at timestamptz;
alter table public.conference_subscriptions add column if not exists due_on date;

create table if not exists public.platform_support_requests(
  id uuid primary key default gen_random_uuid(),
  conference_id uuid not null references public.conferences(id) on delete cascade,
  requested_by uuid not null references public.profiles(id),
  subject text not null check(char_length(trim(subject)) between 2 and 120),
  message text not null check(char_length(trim(message)) between 2 and 1000),
  status text not null default 'open' check(status in('open','resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
alter table public.platform_owner_records enable row level security;
alter table public.platform_support_requests enable row level security;
create policy "Owners view own platform record" on public.platform_owner_records for select to authenticated using(profile_id=(select auth.uid()));
create policy "Owners view own support requests" on public.platform_support_requests for select to authenticated using(requested_by=(select auth.uid()));

create or replace function public.platform_create_owner(p_conference_name text,p_name text,p_email text,p_phone text,p_subscription_starts_on date,p_subscription_ends_on date,p_contract_url text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_owner_id uuid;v_token uuid;
begin
  if not public.is_platform_creator() then raise exception 'Platform Creator access is required.'; end if;
  if char_length(trim(p_conference_name)) not between 2 and 80 or char_length(trim(p_name)) not between 2 and 100 or position('@' in trim(p_email))=0 then raise exception 'Complete the conference, owner name, and email.'; end if;
  insert into public.platform_owner_records(full_name,email,phone,subscription_starts_on,subscription_ends_on,contract_url)
  values(trim(p_name),lower(trim(p_email)),trim(coalesce(p_phone,'')),p_subscription_starts_on,p_subscription_ends_on,nullif(trim(p_contract_url),'')) returning id into v_owner_id;
  insert into public.platform_owner_invitations(conference_name,email,invited_by,owner_record_id)
  values(trim(p_conference_name),lower(trim(p_email)),(select auth.uid()),v_owner_id) returning token into v_token;
  return v_token;
end;
$$;

create or replace function public.platform_set_owner_status(p_owner_id uuid,p_status text)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not public.is_platform_creator() then raise exception 'Platform Creator access is required.'; end if;
  if p_status not in('active','suspended') then raise exception 'Choose Active or Suspended.'; end if;
  update public.platform_owner_records set status=p_status,updated_at=now() where id=p_owner_id;
  if not found then raise exception 'Owner was not found.'; end if;
end;
$$;

create or replace function public.accept_platform_owner_invitation(p_token uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_invite public.platform_owner_invitations%rowtype;v_email text;v_conference_id uuid;v_slug text;
begin
  select * into v_invite from public.platform_owner_invitations where token=p_token for update;
  if v_invite.id is null or v_invite.accepted_at is not null or v_invite.expires_at<now() then raise exception 'This owner invitation is no longer available.'; end if;
  v_email:=lower(coalesce(auth.jwt()->>'email',''));
  if v_email='' or v_email<>lower(v_invite.email) then raise exception 'Sign in with the email address that received this invitation.'; end if;
  v_slug:=lower(regexp_replace(v_invite.conference_name,'[^a-zA-Z0-9]+','-','g'))||'-'||substr(replace(gen_random_uuid()::text,'-',''),1,8);
  insert into public.conferences(name,slug) values(v_invite.conference_name,v_slug) returning id into v_conference_id;
  insert into public.conference_memberships(conference_id,profile_id,role) values(v_conference_id,(select auth.uid()),'owner') on conflict do nothing;
  insert into public.conference_subscriptions(conference_id) values(v_conference_id) on conflict do nothing;
  update public.platform_owner_invitations set accepted_at=now(),accepted_by=(select auth.uid()) where id=v_invite.id;
  update public.platform_owner_records set conference_id=v_conference_id,profile_id=(select auth.uid()),status='active',updated_at=now() where id=v_invite.owner_record_id;
  return v_conference_id;
end;
$$;

create or replace function public.owner_request_platform_support(p_conference_id uuid,p_subject text,p_message text)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not public.user_has_conference_role(p_conference_id,array['owner']::public.conference_role[]) then raise exception 'Owner access is required.'; end if;
  insert into public.platform_support_requests(conference_id,requested_by,subject,message) values(p_conference_id,trim(p_subject),trim(p_message));
end;
$$;

create or replace function public.platform_request_owner_payment(p_conference_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not public.is_platform_creator() then raise exception 'Platform Creator access is required.'; end if;
  insert into public.conference_subscriptions(conference_id,status,requested_at,due_on) values(p_conference_id,'due',now(),current_date) on conflict(conference_id) do update set status='due',requested_at=now(),due_on=current_date,updated_at=now();
end;
$$;

create or replace function public.platform_owner_operations()
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_owners jsonb;v_directory jsonb;v_support jsonb;
begin
  if not public.is_platform_creator() then return jsonb_build_object('authorized',false); end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',record.id,'conferenceId',record.conference_id,'conferenceName',conference.name,'name',record.full_name,'email',record.email,'phone',record.phone,'status',record.status,'subscriptionStartsOn',record.subscription_starts_on,'subscriptionEndsOn',record.subscription_ends_on,'contractUrl',record.contract_url,'invitationToken',invite.token) order by record.created_at desc),'[]'::jsonb) into v_owners from public.platform_owner_records record left join public.conferences conference on conference.id=record.conference_id left join lateral(select token from public.platform_owner_invitations where owner_record_id=record.id order by expires_at desc limit 1) invite on true;
  select coalesce(jsonb_agg(jsonb_build_object('conference',conference.name,'activeDivisions',active_divisions.count,'inactiveDivisions',inactive_divisions.count,'activePlayers',active_players.count,'inactivePlayers',inactive_players.count) order by conference.name),'[]'::jsonb) into v_directory from public.conferences conference left join lateral(select count(*) from public.divisions division join public.seasons season on season.id=division.season_id where season.conference_id=conference.id and season.canceled_at is null and season.ends_on>=current_date) active_divisions(count) on true left join lateral(select count(*) from public.divisions division join public.seasons season on season.id=division.season_id where season.conference_id=conference.id and(season.canceled_at is not null or season.ends_on<current_date)) inactive_divisions(count) on true left join lateral(select count(distinct registration.player_id) from public.registrations registration join public.seasons season on season.id=registration.season_id where season.conference_id=conference.id and registration.status='active' and season.canceled_at is null and season.starts_on<=current_date and season.ends_on>=current_date) active_players(count) on true left join lateral(select count(distinct registration.player_id) from public.registrations registration join public.seasons season on season.id=registration.season_id where season.conference_id=conference.id and (registration.status<>'active' or season.canceled_at is not null or season.ends_on<current_date)) inactive_players(count) on true where coalesce(conference.is_test,false)=false;
  select coalesce(jsonb_agg(jsonb_build_object('id',request.id,'conferenceName',conference.name,'ownerName',profile.display_name,'subject',request.subject,'message',request.message,'status',request.status,'createdAt',request.created_at) order by request.created_at desc),'[]'::jsonb) into v_support from public.platform_support_requests request join public.conferences conference on conference.id=request.conference_id join public.profiles profile on profile.id=request.requested_by;
  return jsonb_build_object('authorized',true,'owners',v_owners,'directory',v_directory,'support',v_support);
end;
$$;

revoke all on function public.platform_create_owner(text,text,text,text,date,date,text),public.platform_set_owner_status(uuid,text),public.accept_platform_owner_invitation(uuid),public.owner_request_platform_support(uuid,text,text),public.platform_request_owner_payment(uuid),public.platform_owner_operations() from public;
grant execute on function public.platform_create_owner(text,text,text,text,date,date,text),public.platform_set_owner_status(uuid,text),public.accept_platform_owner_invitation(uuid),public.owner_request_platform_support(uuid,text,text),public.platform_request_owner_payment(uuid),public.platform_owner_operations() to authenticated;
