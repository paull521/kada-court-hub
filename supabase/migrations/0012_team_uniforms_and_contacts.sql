-- Team uniform defaults and privacy-scoped captain contacts.

create table if not exists public.team_uniform_settings (
  team_id uuid primary key references public.teams(id) on delete cascade,
  home_uniform text not null default 'Dark / Navy' check (char_length(home_uniform) between 1 and 40),
  away_uniform text not null default 'White' check (char_length(away_uniform) between 1 and 40),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);
alter table public.team_uniform_settings enable row level security;
grant select on public.team_uniform_settings to authenticated;
drop policy if exists "Team members view uniform settings" on public.team_uniform_settings;
create policy "Team members view uniform settings" on public.team_uniform_settings for select to authenticated
  using (
    public.user_manages_team(team_id)
    or exists (
      select 1 from public.registrations registration
      join public.player_profiles player on player.id = registration.player_id
      where registration.team_id = team_uniform_settings.team_id
        and registration.status in ('active', 'pending')
        and player.profile_id = (select auth.uid())
    )
  );

create or replace function public.owner_update_team_uniforms(
  p_team_id uuid,
  p_home_uniform text,
  p_away_uniform text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conference_id uuid;
  v_home text := nullif(trim(p_home_uniform), '');
  v_away text := nullif(trim(p_away_uniform), '');
begin
  select season.conference_id into v_conference_id
  from public.teams team
  join public.divisions division on division.id = team.division_id
  join public.seasons season on season.id = division.season_id
  where team.id = p_team_id;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id, array['owner']::public.conference_role[]) then
    raise exception 'Only a conference owner can update team uniforms.';
  end if;
  if v_home is null or v_away is null or char_length(v_home) > 40 or char_length(v_away) > 40 then
    raise exception 'Enter home and away uniform labels of up to 40 characters.';
  end if;
  insert into public.team_uniform_settings (team_id, home_uniform, away_uniform, updated_by)
  values (p_team_id, v_home, v_away, (select auth.uid()))
  on conflict (team_id) do update
    set home_uniform = excluded.home_uniform, away_uniform = excluded.away_uniform,
        updated_at = now(), updated_by = (select auth.uid());
  insert into public.activity_log (conference_id, actor_profile_id, action, entity_type, entity_id, summary)
  values (v_conference_id, (select auth.uid()), 'update', 'team_uniforms', p_team_id::text, 'Updated team uniform defaults');
end;
$$;

create or replace function public.get_team_leadership(p_team_id uuid)
returns table(role_label text, display_name text, mobile text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (
    public.user_manages_team(p_team_id)
    or exists (
      select 1 from public.registrations registration
      join public.player_profiles player on player.id = registration.player_id
      where registration.team_id = p_team_id
        and registration.status in ('active', 'pending')
        and player.profile_id = (select auth.uid())
    )
  ) then raise exception 'Team access required.'; end if;

  return query
  select registration.role_label,
         coalesce(player.display_name, profile.display_name, 'Unnamed player'),
         coalesce(profile.mobile, player.mobile)
  from public.registrations registration
  join public.player_profiles player on player.id = registration.player_id
  left join public.profiles profile on profile.id = player.profile_id
  where registration.team_id = p_team_id and registration.status = 'active'
    and registration.role_label in ('Captain', 'Co-captain')
  order by case registration.role_label when 'Captain' then 1 else 2 end;
end;
$$;

revoke all on function public.owner_update_team_uniforms(uuid,text,text) from public;
revoke all on function public.get_team_leadership(uuid) from public;
grant execute on function public.owner_update_team_uniforms(uuid,text,text) to authenticated;
grant execute on function public.get_team_leadership(uuid) to authenticated;
