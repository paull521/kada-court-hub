-- DEVELOPMENT TEST SEED ONLY. Do not apply this migration to a production KCH database.
-- Allow an owner to roster a player before that player claims a KCH account.
alter table public.player_profiles add column if not exists display_name text;
alter table public.player_profiles add column if not exists email text;
alter table public.player_profiles add column if not exists mobile text;
alter table public.player_profiles add column if not exists claimed_at timestamptz;
alter table public.player_profiles alter column profile_id drop not null;

update public.player_profiles player
set display_name = profile.display_name,
    claimed_at = coalesce(player.claimed_at, now())
from public.profiles profile
where player.profile_id = profile.id and player.display_name is null;

alter table public.player_profiles drop constraint if exists player_profiles_identity_check;
alter table public.player_profiles add constraint player_profiles_identity_check
  check (profile_id is not null or display_name is not null);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_display_name text;
begin
  new_display_name := coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1));
  insert into public.profiles (id, display_name) values (new.id, new_display_name);
  insert into public.player_profiles (profile_id, public_player_id, display_name, email, claimed_at)
  values (new.id, 'KCH-' || upper(substr(replace(new.id::text, '-', ''), 1, 8)), new_display_name, new.email, now());
  return new;
end;
$$;

create or replace function public.user_can_view_player(target_player_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.registrations registration
    join public.seasons season on season.id = registration.season_id
    where registration.player_id = target_player_id
      and (
        public.user_manages_team(registration.team_id)
        or public.user_has_conference_role(season.conference_id, array['owner']::public.conference_role[])
      )
  );
$$;

create policy "Owners and staff view roster identities" on public.player_profiles for select to authenticated
  using (public.user_can_view_player(id));

-- Seed the first conference against the earliest created KCH profile.
do $$
declare
  v_owner_profile_id uuid;
  v_owner_player_id uuid;
  v_conference_id uuid;
  v_season_id uuid;
  v_division_id uuid;
  v_kada_team_id uuid;
  v_owner_registration_id uuid;
begin
  select p.id into v_owner_profile_id from public.profiles p order by p.created_at asc limit 1;
  if v_owner_profile_id is null then raise exception 'Create a KCH profile before running this seed.'; end if;
  select pp.id into v_owner_player_id from public.player_profiles pp where pp.profile_id = v_owner_profile_id;

  insert into public.conferences (name, slug, timezone)
  values ('Seattle Filipino Basketball League', 'seattle-filipino-basketball-league', 'America/Los_Angeles')
  on conflict (slug) do update set name = excluded.name returning id into v_conference_id;

  insert into public.conference_memberships (conference_id, profile_id, role)
  values (v_conference_id, v_owner_profile_id, 'owner'), (v_conference_id, v_owner_profile_id, 'player')
  on conflict (conference_id, profile_id, role) do nothing;

  insert into public.seasons (conference_id, name, starts_on, ends_on, registration_open)
  values (v_conference_id, 'Summer 2026', '2026-06-01', '2026-10-31', true)
  on conflict (conference_id, name) do update set registration_open = true returning id into v_season_id;

  insert into public.divisions (season_id, name) values (v_season_id, 'Division A')
  on conflict (season_id, name) do update set name = excluded.name returning id into v_division_id;

  insert into public.teams (division_id, name) values (v_division_id, 'Team Kada')
  on conflict (division_id, name) do update set active = true returning id into v_kada_team_id;

  insert into public.player_profiles (public_player_id, display_name)
  select seed.public_id, seed.player_name from (values
    ('KCH-SEED-007','Winston Keys'),('KCH-SEED-011','Fritz Rigor'),
    ('KCH-SEED-009','Lennon del Rosario'),('KCH-SEED-010','Tony Davis'),
    ('KCH-SEED-027','Alvin Sabas'),('KCH-SEED-045','Bong Mendoza'),
    ('KCH-SEED-046','Red San Buenaventura'),('KCH-SEED-060','Neph Appostol')
  ) as seed(public_id, player_name)
  on conflict (public_player_id) do update set display_name = excluded.display_name;

  insert into public.registrations (player_id, season_id, team_id, status, jersey_number, position, role_label)
  select pp.id, v_season_id, v_kada_team_id, 'active', seed.jersey, seed.player_position, seed.team_role
  from (values
    ('KCH-SEED-007',7,'Guard','Captain'),('KCH-SEED-011',11,'Guard','Co-captain'),
    ('KCH-SEED-009',9,'Forward','Player'),('KCH-SEED-010',10,'Guard','Player'),
    ('KCH-SEED-027',27,'Forward','Player'),('KCH-SEED-045',45,'Center','Player'),
    ('KCH-SEED-046',46,'Forward','Player'),('KCH-SEED-060',60,'Center','Player')
  ) as seed(public_id, jersey, player_position, team_role)
  join public.player_profiles pp on pp.public_player_id = seed.public_id
  on conflict (player_id, season_id) do update set team_id=excluded.team_id,status='active',jersey_number=excluded.jersey_number,position=excluded.position,role_label=excluded.role_label;

  insert into public.registrations (player_id, season_id, team_id, status, jersey_number, position, role_label)
  values (v_owner_player_id, v_season_id, v_kada_team_id, 'active', 28, 'Forward', 'Player')
  on conflict (player_id, season_id) do update set team_id=excluded.team_id,status='active',jersey_number=28,position='Forward'
  returning id into v_owner_registration_id;

  insert into public.teams (division_id, name)
  select v_division_id, opponent_name from unnest(array['Seattle Ballers','Manila City','Manila Kings','Bellevue Elite','Rain City Hoops','Ballers United']) opponent_name
  on conflict (division_id, name) do nothing;

  insert into public.games (season_id,home_team_id,away_team_id,starts_at,venue,court,home_uniform,away_uniform)
  select v_season_id, v_kada_team_id, opponent.id, seed.starts_at, 'Kada Court Center', seed.court, seed.kada_uniform, case when seed.kada_uniform='White' then 'Dark' else 'White' end
  from (values
    ('Seattle Ballers','2026-08-23 01:30:00+00'::timestamptz,'Court 2','White'),
    ('Manila City','2026-08-29 23:00:00+00'::timestamptz,'Court 1','White'),
    ('Manila Kings','2026-09-07 00:00:00+00'::timestamptz,'Court 3','Dark'),
    ('Bellevue Elite','2026-09-14 02:00:00+00'::timestamptz,'Court 2','White'),
    ('Rain City Hoops','2026-09-21 01:00:00+00'::timestamptz,'Court 1','Dark'),
    ('Ballers United','2026-09-27 22:00:00+00'::timestamptz,'Court 3','White')
  ) as seed(opponent_name, starts_at, court, kada_uniform)
  join public.teams opponent on opponent.division_id=v_division_id and opponent.name=seed.opponent_name
  where not exists (select 1 from public.games game where game.season_id=v_season_id and game.starts_at=seed.starts_at);

  insert into public.fees (registration_id,category,description,amount_cents,status,due_on)
  select v_owner_registration_id, seed.category, seed.description, seed.amount_cents, 'due', '2026-08-22'
  from (values ('league','League Fee',11000),('uniform','Uniform Fee',6000),('platform','Platform Fee',100)) as seed(category,description,amount_cents)
  where not exists (select 1 from public.fees fee where fee.registration_id=v_owner_registration_id and fee.category=seed.category);
end $$;
