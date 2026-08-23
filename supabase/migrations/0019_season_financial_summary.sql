-- Conference-owner expense tracking and season profit/loss summaries.
create table if not exists public.season_financial_summaries (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null unique references public.seasons(id) on delete restrict,
  court_cost_cents integer not null default 0 check (court_cost_cents>=0),
  referee_cost_cents integer not null default 0 check (referee_cost_cents>=0),
  uniform_cost_cents integer not null default 0 check (uniform_cost_cents>=0),
  league_cost_cents integer not null default 0 check (league_cost_cents>=0),
  notes text check (notes is null or char_length(notes)<=1000),
  updated_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.season_financial_summaries enable row level security;
grant select on public.season_financial_summaries to authenticated;

drop policy if exists "Conference owners view season financial summaries" on public.season_financial_summaries;
create policy "Conference owners view season financial summaries"
on public.season_financial_summaries for select to authenticated
using (
  exists (
    select 1 from public.seasons season
    where season.id=season_id
      and public.user_has_conference_role(season.conference_id,array['owner']::public.conference_role[])
  )
);

create or replace function public.owner_update_season_financial_summary(
  p_season_id uuid,
  p_court_cost_cents integer,
  p_referee_cost_cents integer,
  p_uniform_cost_cents integer,
  p_league_cost_cents integer,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_conference_id uuid;
  v_notes text:=nullif(trim(p_notes),'');
begin
  select conference_id into v_conference_id from public.seasons where id=p_season_id;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then
    raise exception 'Only the conference owner can update season finances.';
  end if;
  if least(p_court_cost_cents,p_referee_cost_cents,p_uniform_cost_cents,p_league_cost_cents)<0 then
    raise exception 'Expense amounts cannot be negative.';
  end if;
  if greatest(p_court_cost_cents,p_referee_cost_cents,p_uniform_cost_cents,p_league_cost_cents)>100000000 then
    raise exception 'An expense amount is too large.';
  end if;
  if char_length(coalesce(v_notes,''))>1000 then raise exception 'Enter shorter financial notes.'; end if;

  insert into public.season_financial_summaries(
    season_id,court_cost_cents,referee_cost_cents,uniform_cost_cents,league_cost_cents,notes,updated_by
  ) values(
    p_season_id,p_court_cost_cents,p_referee_cost_cents,p_uniform_cost_cents,p_league_cost_cents,v_notes,(select auth.uid())
  )
  on conflict(season_id) do update set
    court_cost_cents=excluded.court_cost_cents,
    referee_cost_cents=excluded.referee_cost_cents,
    uniform_cost_cents=excluded.uniform_cost_cents,
    league_cost_cents=excluded.league_cost_cents,
    notes=excluded.notes,
    updated_by=excluded.updated_by,
    updated_at=now();

  insert into public.activity_log(conference_id,actor_profile_id,action,entity_type,entity_id,summary)
  values(v_conference_id,(select auth.uid()),'update','season_financial_summary',p_season_id::text,'Updated season expenses and financial summary');
end;
$$;

revoke all on function public.owner_update_season_financial_summary(uuid,integer,integer,integer,integer,text) from public;
grant execute on function public.owner_update_season_financial_summary(uuid,integer,integer,integer,integer,text) to authenticated;
