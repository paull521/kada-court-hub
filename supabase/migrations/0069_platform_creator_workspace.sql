-- KCH Platform Creator: aggregate platform oversight without conference operations.
-- Add the initial creator account manually after the account has signed up:
-- insert into public.platform_administrators(profile_id) values ('<profile uuid>');

create table if not exists public.platform_administrators(
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  mfa_required boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.platform_owner_invitations(
  id uuid primary key default gen_random_uuid(),
  token uuid not null unique default gen_random_uuid(),
  conference_name text not null check(char_length(trim(conference_name)) between 2 and 80),
  email text not null check(char_length(email)<=254),
  invited_by uuid not null references public.profiles(id),
  expires_at timestamptz not null default now()+interval '14 days',
  accepted_at timestamptz,
  accepted_by uuid references public.profiles(id)
);

create table if not exists public.conference_subscriptions(
  conference_id uuid primary key references public.conferences(id) on delete cascade,
  monthly_amount_cents integer not null default 5000 check(monthly_amount_cents>0),
  status text not null default 'due' check(status in('due','paid','paused')),
  paid_through date,
  updated_at timestamptz not null default now()
);
insert into public.conference_subscriptions(conference_id)
select id from public.conferences
on conflict(conference_id) do nothing;

create table if not exists public.conference_subscription_payment_submissions(
  id uuid primary key default gen_random_uuid(),
  conference_id uuid not null references public.conferences(id) on delete cascade,
  submitted_by uuid not null references public.profiles(id),
  amount_cents integer not null check(amount_cents>0),
  method text not null check(method in('zelle','cash')),
  status text not null default 'pending' check(status in('pending','confirmed','declined')),
  submitted_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz
);
create unique index if not exists conference_subscription_one_pending_idx on public.conference_subscription_payment_submissions(conference_id) where status='pending';

alter table public.platform_administrators enable row level security;
alter table public.platform_owner_invitations enable row level security;
alter table public.conference_subscriptions enable row level security;
alter table public.conference_subscription_payment_submissions enable row level security;

create or replace function public.is_platform_creator()
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.platform_administrators admin where admin.profile_id=(select auth.uid()) and(not admin.mfa_required or coalesce(auth.jwt()->>'aal','aal1')='aal2'));
$$;

create or replace function public.platform_creator_dashboard()
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_admin_name text;v_conferences integer;v_owners integer;v_paid integer;v_due integer;v_players integer;v_pending jsonb;v_invites jsonb;
begin
  if not public.is_platform_creator() then return jsonb_build_object('authorized',false); end if;
  select display_name into v_admin_name from public.profiles where id=(select auth.uid());
  select count(*) into v_conferences from public.conferences where coalesce(is_test,false)=false;
  select count(distinct membership.profile_id) into v_owners from public.conference_memberships membership join public.conferences conference on conference.id=membership.conference_id where membership.role='owner' and coalesce(conference.is_test,false)=false;
  select count(*) filter(where subscription.status='paid' and subscription.paid_through>=current_date),count(*) filter(where subscription.status<>'paid' or subscription.paid_through<current_date) into v_paid,v_due from public.conference_subscriptions subscription join public.conferences conference on conference.id=subscription.conference_id where coalesce(conference.is_test,false)=false;
  select count(*) into v_players from public.registrations registration join public.seasons season on season.id=registration.season_id join public.conferences conference on conference.id=season.conference_id where registration.status='active' and coalesce(conference.is_test,false)=false;
  select coalesce(jsonb_agg(jsonb_build_object('id',submission.id,'conferenceName',conference.name,'ownerName',profile.display_name,'amount',submission.amount_cents/100.0,'method',submission.method,'submittedAt',submission.submitted_at) order by submission.submitted_at desc),'[]'::jsonb) into v_pending from public.conference_subscription_payment_submissions submission join public.conferences conference on conference.id=submission.conference_id join public.profiles profile on profile.id=submission.submitted_by where submission.status='pending';
  select coalesce(jsonb_agg(jsonb_build_object('id',invite.id,'conferenceName',invite.conference_name,'email',invite.email,'token',invite.token,'createdAt',invite.expires_at-interval '14 days','acceptedAt',invite.accepted_at) order by invite.expires_at desc),'[]'::jsonb) into v_invites from public.platform_owner_invitations invite;
  return jsonb_build_object('authorized',true,'admin_name',coalesce(v_admin_name,''),'conference_count',v_conferences,'owner_count',v_owners,'active_subscriptions',v_paid,'subscriptions_due',v_due,'active_players',v_players,'platform_fee_cents',v_players*100,'pending_subscription_payments',v_pending,'recent_invitations',v_invites);
end;
$$;

create or replace function public.platform_invite_owner(p_email text,p_conference_name text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_token uuid;
begin
  if not public.is_platform_creator() then raise exception 'Platform Creator access is required.'; end if;
  if char_length(trim(p_conference_name)) not between 2 and 80 or char_length(trim(p_email))>254 or position('@' in trim(p_email))=0 then raise exception 'Enter a valid conference name and owner email.'; end if;
  insert into public.platform_owner_invitations(conference_name,email,invited_by) values(trim(p_conference_name),lower(trim(p_email)),(select auth.uid())) returning token into v_token;
  return v_token;
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
  return v_conference_id;
end;
$$;

create or replace function public.owner_submit_subscription_payment(p_conference_id uuid,p_amount_cents integer,p_method text)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not public.user_has_conference_role(p_conference_id,array['owner']::public.conference_role[]) then raise exception 'Only the conference owner can submit this payment.'; end if;
  if p_amount_cents<1 or p_method not in('zelle','cash') then raise exception 'Choose a valid payment amount and method.'; end if;
  if exists(select 1 from public.conference_subscription_payment_submissions where conference_id=p_conference_id and status='pending') then raise exception 'A subscription payment is already awaiting confirmation.'; end if;
  insert into public.conference_subscription_payment_submissions(conference_id,submitted_by,amount_cents,method) values(p_conference_id,(select auth.uid()),p_amount_cents,p_method);
end;
$$;

create or replace function public.platform_review_subscription_payment(p_submission_id uuid,p_decision text)
returns void language plpgsql security definer set search_path='' as $$
declare v_submission public.conference_subscription_payment_submissions%rowtype;
begin
  if not public.is_platform_creator() then raise exception 'Platform Creator access is required.'; end if;
  if p_decision not in('confirmed','declined') then raise exception 'Choose Confirm or Decline.'; end if;
  select * into v_submission from public.conference_subscription_payment_submissions where id=p_submission_id for update;
  if v_submission.id is null or v_submission.status<>'pending' then raise exception 'This subscription payment was already reviewed.'; end if;
  update public.conference_subscription_payment_submissions set status=p_decision,reviewed_by=(select auth.uid()),reviewed_at=now() where id=p_submission_id;
  if p_decision='confirmed' then
    insert into public.conference_subscriptions(conference_id,status,paid_through,updated_at) values(v_submission.conference_id,'paid',(current_date+interval '1 month')::date,now()) on conflict(conference_id) do update set status='paid',paid_through=greatest(coalesce(conference_subscriptions.paid_through,current_date),(current_date+interval '1 month')::date),updated_at=now();
  end if;
end;
$$;

revoke all on function public.platform_creator_dashboard() from public;
revoke all on function public.platform_invite_owner(text,text) from public;
revoke all on function public.accept_platform_owner_invitation(uuid) from public;
revoke all on function public.owner_submit_subscription_payment(uuid,integer,text) from public;
revoke all on function public.platform_review_subscription_payment(uuid,text) from public;
grant execute on function public.platform_creator_dashboard(),public.platform_invite_owner(text,text),public.accept_platform_owner_invitation(uuid),public.owner_submit_subscription_payment(uuid,integer,text),public.platform_review_subscription_payment(uuid,text) to authenticated;
