create extension if not exists pgcrypto;

create type public.conference_role as enum ('player', 'team_staff', 'owner');
create type public.registration_status as enum ('pending', 'active', 'inactive');
create type public.fee_status as enum ('due', 'paid', 'waived');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  mobile text,
  birthdate date,
  location text,
  created_at timestamptz not null default now()
);

create table public.player_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  public_player_id text not null unique,
  preferred_uniform_size text,
  created_at timestamptz not null default now()
);

create table public.conferences (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  timezone text not null default 'America/Los_Angeles',
  created_at timestamptz not null default now()
);

create table public.conference_memberships (
  id uuid primary key default gen_random_uuid(),
  conference_id uuid not null references public.conferences(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.conference_role not null,
  created_at timestamptz not null default now(),
  unique (conference_id, profile_id, role)
);

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  conference_id uuid not null references public.conferences(id) on delete cascade,
  name text not null,
  starts_on date not null,
  ends_on date not null,
  registration_open boolean not null default false,
  archived_at timestamptz,
  unique (conference_id, name)
);

create table public.divisions (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  name text not null,
  unique (season_id, name)
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  division_id uuid not null references public.divisions(id) on delete cascade,
  name text not null,
  logo_path text,
  active boolean not null default true,
  unique (division_id, name)
);

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.player_profiles(id) on delete cascade,
  season_id uuid not null references public.seasons(id) on delete cascade,
  team_id uuid references public.teams(id) on delete set null,
  status public.registration_status not null default 'pending',
  jersey_number integer check (jersey_number between 0 and 99),
  position text,
  role_label text not null default 'Player',
  created_at timestamptz not null default now(),
  unique (player_id, season_id)
);

create table public.games (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  home_team_id uuid not null references public.teams(id),
  away_team_id uuid not null references public.teams(id),
  starts_at timestamptz not null,
  venue text not null,
  court text,
  home_uniform text,
  away_uniform text,
  home_score integer,
  away_score integer,
  check (home_team_id <> away_team_id)
);

create table public.fees (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations(id) on delete cascade,
  category text not null check (category in ('league', 'uniform', 'platform', 'other')),
  description text not null,
  amount_cents integer not null check (amount_cents >= 0),
  status public.fee_status not null default 'due',
  due_on date,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  fee_id uuid not null references public.fees(id) on delete restrict,
  amount_cents integer not null check (amount_cents > 0),
  method text not null check (method in ('zelle', 'cash', 'card', 'other')),
  recorded_by uuid not null references public.profiles(id),
  paid_at timestamptz not null default now(),
  note text
);

create table public.activity_log (
  id bigint generated always as identity primary key,
  conference_id uuid not null references public.conferences(id) on delete cascade,
  actor_profile_id uuid not null references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id text not null,
  summary text not null,
  created_at timestamptz not null default now()
);

create index conference_memberships_profile_idx on public.conference_memberships(profile_id);
create index seasons_conference_idx on public.seasons(conference_id);
create index registrations_team_idx on public.registrations(team_id);
create index games_season_starts_idx on public.games(season_id, starts_at);
create index fees_registration_idx on public.fees(registration_id);
create index activity_log_conference_created_idx on public.activity_log(conference_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.player_profiles enable row level security;
alter table public.conferences enable row level security;
alter table public.conference_memberships enable row level security;
alter table public.seasons enable row level security;
alter table public.divisions enable row level security;
alter table public.teams enable row level security;
alter table public.registrations enable row level security;
alter table public.games enable row level security;
alter table public.fees enable row level security;
alter table public.payments enable row level security;
alter table public.activity_log enable row level security;

create table public.team_staff_assignments (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.conference_memberships(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  title text not null default 'Team Staff',
  unique (membership_id, team_id)
);

create index team_staff_assignments_membership_idx on public.team_staff_assignments(membership_id);
alter table public.team_staff_assignments enable row level security;

create or replace function public.user_belongs_to_conference(target_conference_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.conference_memberships membership
    where membership.conference_id = target_conference_id
      and membership.profile_id = (select auth.uid())
  );
$$;

create or replace function public.user_has_conference_role(target_conference_id uuid, allowed_roles public.conference_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.conference_memberships membership
    where membership.conference_id = target_conference_id
      and membership.profile_id = (select auth.uid())
      and membership.role = any(allowed_roles)
  );
$$;

create or replace function public.user_manages_team(target_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.team_staff_assignments assignment
    join public.conference_memberships membership on membership.id = assignment.membership_id
    where assignment.team_id = target_team_id
      and membership.profile_id = (select auth.uid())
      and membership.role = 'team_staff'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));

  insert into public.player_profiles (profile_id, public_player_id)
  values (new.id, 'KCH-' || upper(substr(replace(new.id::text, '-', ''), 1, 8)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

grant usage on schema public to authenticated;
grant select on public.profiles, public.player_profiles, public.conferences,
  public.conference_memberships, public.seasons, public.divisions, public.teams,
  public.registrations, public.games, public.fees, public.payments,
  public.activity_log, public.team_staff_assignments to authenticated;
grant update (display_name, mobile, birthdate, location) on public.profiles to authenticated;

create policy "Users view own profile" on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy "Users update own profile" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "Users view own player identity" on public.player_profiles for select to authenticated
  using (profile_id = (select auth.uid()));
create policy "Members view own memberships" on public.conference_memberships for select to authenticated
  using (profile_id = (select auth.uid()) or public.user_has_conference_role(conference_id, array['owner']::public.conference_role[]));
create policy "Members view conferences" on public.conferences for select to authenticated
  using (public.user_belongs_to_conference(id));
create policy "Members view seasons" on public.seasons for select to authenticated
  using (public.user_belongs_to_conference(conference_id));
create policy "Members view divisions" on public.divisions for select to authenticated
  using (exists (select 1 from public.seasons season where season.id = season_id and public.user_belongs_to_conference(season.conference_id)));
create policy "Members view teams" on public.teams for select to authenticated
  using (exists (select 1 from public.divisions division join public.seasons season on season.id = division.season_id where division.id = division_id and public.user_belongs_to_conference(season.conference_id)));
create policy "Members view games" on public.games for select to authenticated
  using (exists (select 1 from public.seasons season where season.id = season_id and public.user_belongs_to_conference(season.conference_id)));
create policy "Players and managers view registrations" on public.registrations for select to authenticated
  using (
    exists (select 1 from public.player_profiles player where player.id = player_id and player.profile_id = (select auth.uid()))
    or public.user_manages_team(team_id)
    or exists (select 1 from public.seasons season where season.id = season_id and public.user_has_conference_role(season.conference_id, array['owner']::public.conference_role[]))
  );
create policy "Players and owners view fees" on public.fees for select to authenticated
  using (exists (
    select 1 from public.registrations registration
    join public.player_profiles player on player.id = registration.player_id
    join public.seasons season on season.id = registration.season_id
    where registration.id = registration_id
      and (player.profile_id = (select auth.uid()) or public.user_has_conference_role(season.conference_id, array['owner']::public.conference_role[]))
  ));
create policy "Players and owners view payments" on public.payments for select to authenticated
  using (exists (
    select 1 from public.fees fee
    join public.registrations registration on registration.id = fee.registration_id
    join public.player_profiles player on player.id = registration.player_id
    join public.seasons season on season.id = registration.season_id
    where fee.id = fee_id
      and (player.profile_id = (select auth.uid()) or public.user_has_conference_role(season.conference_id, array['owner']::public.conference_role[]))
  ));
create policy "Members view assigned staff" on public.team_staff_assignments for select to authenticated
  using (exists (select 1 from public.conference_memberships membership where membership.id = membership_id and (membership.profile_id = (select auth.uid()) or public.user_has_conference_role(membership.conference_id, array['owner']::public.conference_role[]))));
create policy "Owners view activity" on public.activity_log for select to authenticated
  using (public.user_has_conference_role(conference_id, array['owner']::public.conference_role[]));
