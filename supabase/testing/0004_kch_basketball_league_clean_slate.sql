-- TEST DATA ONLY. Never apply this file to a production KCH database.
-- Creates one clean admin-owned test conference with a 150-player directory.
-- Re-running removes only seasons inside this specific test conference.

do $$
declare
  v_owner_profile_id uuid;
  v_conference_id uuid;
begin
  select profile.id into v_owner_profile_id
  from public.profiles profile
  order by profile.created_at
  limit 1;
  if v_owner_profile_id is null then
    raise exception 'Create your KCH profile before running this test setup.';
  end if;

  insert into public.conferences(name,slug,timezone,is_test)
  values('KCH Basketball League','kch-basketball-league-test','America/Los_Angeles',true)
  on conflict(slug) do update
    set name=excluded.name,timezone=excluded.timezone,is_test=true
  returning id into v_conference_id;

  insert into public.conference_memberships(conference_id,profile_id,role,created_at)
  values(v_conference_id,v_owner_profile_id,'owner',now())
  on conflict(conference_id,profile_id,role) do update set created_at=now();

  -- Clean slate: only seasons belonging to this disposable conference.
  delete from public.seasons season where season.conference_id=v_conference_id;
  delete from public.conference_player_pool pool where pool.conference_id=v_conference_id;

  create temporary table kch_clean_player_pool(
    test_number integer primary key,
    display_name text not null,
    public_player_id text not null,
    email text not null,
    mobile text not null
  ) on commit drop;

  insert into kch_clean_player_pool(test_number,display_name,public_player_id,email,mobile)
  select generated.test_number,
         generated.first_name || ' ' || generated.last_name,
         'KCH-TEST-' || upper(substr(replace(v_conference_id::text,'-',''),1,6)) || '-' || lpad(generated.test_number::text,3,'0'),
         'player' || lpad(generated.test_number::text,3,'0') || '.kch@example.com',
         case when generated.test_number<=100
           then '+1 202-555-' || lpad((99+generated.test_number)::text,4,'0')
           else '+1 206-555-' || lpad((generated.test_number-1)::text,4,'0') end
  from (
    select (((last_name.ordinality-1)*15)+first_name.ordinality)::integer as test_number,
           first_name.value as first_name,last_name.value as last_name
    from unnest(array[
      'Adrian','Alyssa','Andre','Bianca','Carlo','Daniel','Elena','Gabriel','Isabel','Jasmine',
      'Joshua','Kristine','Lorenzo','Marissa','Nathan'
    ]) with ordinality as first_name(value,ordinality)
    cross join unnest(array[
      'Aguilar','Bautista','Castillo','Del Rosario','Evangelista',
      'Flores','Garcia','Mendoza','Navarro','Santos'
    ]) with ordinality as last_name(value,ordinality)
  ) generated;

  insert into public.player_profiles(public_player_id,display_name,email,mobile)
  select generated.public_player_id,generated.display_name,generated.email,generated.mobile
  from kch_clean_player_pool generated
  on conflict(public_player_id) do update
    set display_name=excluded.display_name,email=excluded.email,mobile=excluded.mobile;

  insert into public.conference_player_pool(conference_id,player_id)
  select v_conference_id,player.id
  from kch_clean_player_pool generated
  join public.player_profiles player on player.public_player_id=generated.public_player_id
  on conflict(conference_id,player_id) do nothing;
end;
$$;

select conference.name as conference,
       count(pool.player_id) as fictional_players,
       count(season.id) as seasons
from public.conferences conference
left join public.conference_player_pool pool on pool.conference_id=conference.id
left join public.seasons season on season.conference_id=conference.id
where conference.slug='kch-basketball-league-test'
group by conference.id,conference.name;
