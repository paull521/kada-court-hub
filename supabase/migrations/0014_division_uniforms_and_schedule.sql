-- One uniform package and one scheduling workspace per season division.
-- Team settings are kept in sync for compatibility with existing player views.

create table if not exists public.division_uniform_settings (
  division_id uuid primary key references public.divisions(id) on delete cascade,
  dark_uniform text not null default 'Dark / Navy' check (char_length(dark_uniform) between 1 and 40),
  light_uniform text not null default 'White' check (char_length(light_uniform) between 1 and 40),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);
alter table public.division_uniform_settings enable row level security;
grant select on public.division_uniform_settings to authenticated;
drop policy if exists "Conference members view division uniforms" on public.division_uniform_settings;
create policy "Conference members view division uniforms" on public.division_uniform_settings for select to authenticated
  using (exists (
    select 1 from public.divisions division
    join public.seasons season on season.id = division.season_id
    where division.id = division_uniform_settings.division_id
      and public.user_belongs_to_conference(season.conference_id)
  ));

insert into public.division_uniform_settings (division_id, dark_uniform, light_uniform)
select division.id,
       coalesce((array_agg(setting.home_uniform order by setting.updated_at desc) filter (where setting.team_id is not null))[1], 'Dark / Navy'),
       coalesce((array_agg(setting.away_uniform order by setting.updated_at desc) filter (where setting.team_id is not null))[1], 'White')
from public.divisions division
left join public.teams team on team.division_id = division.id
left join public.team_uniform_settings setting on setting.team_id = team.id
group by division.id
on conflict (division_id) do nothing;

insert into public.team_uniform_settings (team_id, home_uniform, away_uniform)
select team.id, setting.dark_uniform, setting.light_uniform
from public.teams team
join public.division_uniform_settings setting on setting.division_id = team.division_id
on conflict (team_id) do update
  set home_uniform = excluded.home_uniform,
      away_uniform = excluded.away_uniform,
      updated_at = now();

create or replace function public.owner_update_division_uniforms(
  p_division_id uuid,
  p_dark_uniform text,
  p_light_uniform text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conference_id uuid;
  v_dark text := nullif(trim(p_dark_uniform), '');
  v_light text := nullif(trim(p_light_uniform), '');
begin
  select season.conference_id into v_conference_id
  from public.divisions division
  join public.seasons season on season.id = division.season_id
  where division.id = p_division_id;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id, array['owner']::public.conference_role[]) then
    raise exception 'Only a conference owner can update division uniforms.';
  end if;
  if v_dark is null or v_light is null or char_length(v_dark) > 40 or char_length(v_light) > 40 then
    raise exception 'Enter dark and light uniform labels of up to 40 characters.';
  end if;

  insert into public.division_uniform_settings (division_id, dark_uniform, light_uniform, updated_by)
  values (p_division_id, v_dark, v_light, (select auth.uid()))
  on conflict (division_id) do update
    set dark_uniform = excluded.dark_uniform,
        light_uniform = excluded.light_uniform,
        updated_at = now(),
        updated_by = (select auth.uid());

  insert into public.team_uniform_settings (team_id, home_uniform, away_uniform, updated_by)
  select team.id, v_dark, v_light, (select auth.uid())
  from public.teams team where team.division_id = p_division_id
  on conflict (team_id) do update
    set home_uniform = excluded.home_uniform,
        away_uniform = excluded.away_uniform,
        updated_at = now(),
        updated_by = (select auth.uid());

  insert into public.activity_log (conference_id, actor_profile_id, action, entity_type, entity_id, summary)
  values (v_conference_id, (select auth.uid()), 'update', 'division_uniforms', p_division_id::text, 'Updated division uniform package');
end;
$$;

create or replace function public.owner_create_division_game(
  p_division_id uuid,
  p_home_team_id uuid,
  p_away_team_id uuid,
  p_starts_at timestamp without time zone,
  p_venue text,
  p_court text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_season_id uuid;
  v_conference_id uuid;
  v_timezone text;
  v_game_id uuid;
  v_venue text := nullif(trim(p_venue), '');
begin
  select season.id, season.conference_id, conference.timezone
    into v_season_id, v_conference_id, v_timezone
  from public.divisions division
  join public.seasons season on season.id = division.season_id
  join public.conferences conference on conference.id = season.conference_id
  where division.id = p_division_id;

  if v_conference_id is null or not public.user_has_conference_role(v_conference_id, array['owner']::public.conference_role[]) then
    raise exception 'Only a conference owner can schedule games.';
  end if;
  if p_home_team_id = p_away_team_id then raise exception 'Choose two different teams.'; end if;
  if v_venue is null or char_length(v_venue) > 120 then raise exception 'Enter a venue of up to 120 characters.'; end if;
  if char_length(coalesce(p_court, '')) > 60 then raise exception 'Enter a shorter court name.'; end if;
  if not exists (select 1 from public.teams where id = p_home_team_id and division_id = p_division_id and active)
     or not exists (select 1 from public.teams where id = p_away_team_id and division_id = p_division_id and active) then
    raise exception 'Both teams must belong to this division.';
  end if;

  insert into public.games (season_id, home_team_id, away_team_id, starts_at, venue, court, home_uniform, away_uniform)
  values (v_season_id, p_home_team_id, p_away_team_id, p_starts_at at time zone v_timezone,
          v_venue, nullif(trim(p_court), ''), 'White', 'Dark')
  returning id into v_game_id;

  insert into public.notifications (profile_id, notification_type, title, body, link_path, entity_id)
  select distinct player.profile_id, 'game_scheduled', 'New game scheduled',
         'A new game was added to your schedule.', '/schedule', v_game_id
  from public.registrations registration
  join public.player_profiles player on player.id = registration.player_id
  where registration.team_id in (p_home_team_id, p_away_team_id)
    and registration.status = 'active' and player.profile_id is not null
  on conflict (profile_id, notification_type, entity_id) do update
    set title = excluded.title, body = excluded.body, link_path = excluded.link_path,
        read_at = null, created_at = now();

  insert into public.activity_log (conference_id, actor_profile_id, action, entity_type, entity_id, summary)
  values (v_conference_id, (select auth.uid()), 'create', 'game', v_game_id::text, 'Scheduled a division game');
  return v_game_id;
end;
$$;

revoke all on function public.owner_update_division_uniforms(uuid,text,text) from public;
revoke all on function public.owner_create_division_game(uuid,uuid,uuid,timestamp without time zone,text,text) from public;
grant execute on function public.owner_update_division_uniforms(uuid,text,text) to authenticated;
grant execute on function public.owner_create_division_game(uuid,uuid,uuid,timestamp without time zone,text,text) to authenticated;
