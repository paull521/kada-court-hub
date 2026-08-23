-- Player notification preferences. In-app records remain preserved; the bell
-- respects these category choices when presenting updates.

create table if not exists public.notification_preferences (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  game_updates boolean not null default true,
  team_updates boolean not null default true,
  payment_updates boolean not null default true,
  season_updates boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.notification_preferences enable row level security;
grant select on public.notification_preferences to authenticated;
drop policy if exists "Users view own notification preferences" on public.notification_preferences;
create policy "Users view own notification preferences" on public.notification_preferences for select to authenticated
  using (profile_id = (select auth.uid()));

create or replace function public.update_notification_preferences(
  p_game_updates boolean,
  p_team_updates boolean,
  p_payment_updates boolean,
  p_season_updates boolean
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notification_preferences
    (profile_id, game_updates, team_updates, payment_updates, season_updates)
  values
    ((select auth.uid()), p_game_updates, p_team_updates, p_payment_updates, p_season_updates)
  on conflict (profile_id) do update
    set game_updates = excluded.game_updates,
        team_updates = excluded.team_updates,
        payment_updates = excluded.payment_updates,
        season_updates = excluded.season_updates,
        updated_at = now();
$$;

revoke all on function public.update_notification_preferences(boolean,boolean,boolean,boolean) from public;
grant execute on function public.update_notification_preferences(boolean,boolean,boolean,boolean) to authenticated;
