-- Owner-created test conferences and isolated synthetic player pools.

alter table public.conferences add column if not exists is_test boolean not null default false;

create table if not exists public.conference_player_pool (
  id uuid primary key default gen_random_uuid(),
  conference_id uuid not null references public.conferences(id) on delete cascade,
  player_id uuid not null references public.player_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (conference_id,player_id)
);

create index if not exists conference_player_pool_conference_idx
  on public.conference_player_pool(conference_id,created_at);

alter table public.conference_player_pool enable row level security;
grant select on public.conference_player_pool to authenticated;
drop policy if exists "Owners view conference player pool" on public.conference_player_pool;
create policy "Owners view conference player pool" on public.conference_player_pool
  for select to authenticated using (
    public.user_has_conference_role(conference_id,array['owner']::public.conference_role[])
  );

create or replace function public.owner_create_test_conference(
  p_name text,
  p_timezone text default 'America/Los_Angeles'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := nullif(trim(p_name),'');
  v_slug text;
  v_conference_id uuid;
  v_player_id uuid;
  v_index integer;
  v_first_names text[] := array[
    'Adrian','Alyssa','Andre','Bianca','Carlo','Daniel','Elena','Gabriel','Isabel','Jasmine',
    'Joshua','Kristine','Lorenzo','Marissa','Nathan'
  ];
  v_last_names text[] := array[
    'Aguilar','Bautista','Castillo','Del Rosario','Evangelista','Flores','Garcia','Mendoza','Navarro','Santos'
  ];
  v_display_name text;
  v_public_id text;
  v_email text;
  v_mobile text;
begin
  if (select auth.uid()) is null then raise exception 'Log in before creating a conference.'; end if;
  if not exists(select 1 from public.profiles profile where profile.id=(select auth.uid())) then
    raise exception 'Create your KCH profile before creating a conference.';
  end if;
  if v_name is null or char_length(v_name)>80 then raise exception 'Enter a conference name of up to 80 characters.'; end if;
  if p_timezone not in ('America/Los_Angeles','America/Denver','America/Chicago','America/New_York') then
    raise exception 'Choose a supported conference timezone.';
  end if;

  v_slug := trim(both '-' from regexp_replace(lower(v_name),'[^a-z0-9]+','-','g'))
            || '-test-' || lower(substr(replace(gen_random_uuid()::text,'-',''),1,8));
  insert into public.conferences(name,slug,timezone,is_test)
  values(v_name,v_slug,p_timezone,true)
  returning id into v_conference_id;
  insert into public.conference_memberships(conference_id,profile_id,role)
  values(v_conference_id,(select auth.uid()),'owner')
  on conflict(conference_id,profile_id,role) do nothing;

  for v_index in 1..150 loop
    v_display_name := v_first_names[((v_index-1)%15)+1] || ' '
      || v_last_names[((v_index-1)/15)+1];
    v_public_id := 'KCH-TEST-' || upper(substr(replace(v_conference_id::text,'-',''),1,6)) || '-' || lpad(v_index::text,3,'0');
    v_email := 'player' || lpad(v_index::text,3,'0') || '.'
      || lower(substr(replace(v_conference_id::text,'-',''),1,6)) || '@example.com';
    v_mobile := case when v_index<=100
      then '+1 202-555-' || lpad((99+v_index)::text,4,'0')
      else '+1 206-555-' || lpad((v_index-1)::text,4,'0') end;
    insert into public.player_profiles(public_player_id,display_name,email,mobile)
    values(v_public_id,v_display_name,v_email,v_mobile)
    on conflict(public_player_id) do update
      set display_name=excluded.display_name,email=excluded.email,mobile=excluded.mobile
    returning id into v_player_id;
    insert into public.conference_player_pool(conference_id,player_id)
    values(v_conference_id,v_player_id)
    on conflict(conference_id,player_id) do nothing;
  end loop;

  insert into public.activity_log(conference_id,actor_profile_id,action,entity_type,entity_id,summary)
  values(v_conference_id,(select auth.uid()),'create','test_conference',v_conference_id::text,
         'Created an isolated test conference with 150 fictional players');
  return v_conference_id;
end;
$$;

revoke all on function public.owner_create_test_conference(text,text) from public;
grant execute on function public.owner_create_test_conference(text,text) to authenticated;
