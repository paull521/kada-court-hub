-- WAPinoy demo: Paul Lazarte owns, plays, and co-captains Magenta Ballers.
-- The nine other Magenta players are name-only demo records with non-deliverable contact details.

do $$
declare
  v_owner_profile_id uuid;
  v_owner_player_id uuid;
  v_owner_name text;
  v_owner_email text;
  v_owner_phone text;
  v_conference_id uuid;
  v_season_id uuid;
  v_east_id uuid;
  v_west_id uuid;
  v_over40_id uuid;
begin
  select profile.id,profile.display_name,coalesce(profile.mobile,'')
    into v_owner_profile_id,v_owner_name,v_owner_phone
  from public.profiles profile
  where lower(profile.display_name)=lower('Paul Lazarte')
  order by profile.created_at
  limit 1;

  if v_owner_profile_id is null then
    raise exception 'Paul Lazarte''s KCH profile was not found.';
  end if;

  select player.id into v_owner_player_id
  from public.player_profiles player
  where player.profile_id=v_owner_profile_id;

  if v_owner_player_id is null then
    insert into public.player_profiles(profile_id,public_player_id,display_name,email,claimed_at)
    values(
      v_owner_profile_id,
      'KCH-'||upper(substr(replace(v_owner_profile_id::text,'-',''),1,8)),
      v_owner_name,
      null,
      now()
    )
    returning id into v_owner_player_id;
  end if;

  select record.email into v_owner_email
  from public.platform_owner_records record
  where record.profile_id=v_owner_profile_id
  order by record.created_at
  limit 1;
  v_owner_email:=coalesce(v_owner_email,lower(v_owner_profile_id::text)||'@kch.local');

  insert into public.conferences(name,slug,timezone,is_test)
  values('WAPinoy','wapinoy','America/Los_Angeles',false)
  on conflict(slug) do update set name=excluded.name,timezone=excluded.timezone,is_test=false
  returning id into v_conference_id;

  insert into public.conference_memberships(conference_id,profile_id,role)
  values
    (v_conference_id,v_owner_profile_id,'owner'),
    (v_conference_id,v_owner_profile_id,'player')
  on conflict do nothing;

  insert into public.platform_owner_records(
    conference_id,profile_id,full_name,email,phone,status,subscription_starts_on
  )
  values(
    v_conference_id,v_owner_profile_id,v_owner_name,v_owner_email,v_owner_phone,'active','2026-08-21'
  )
  on conflict(conference_id) do update set
    profile_id=excluded.profile_id,
    full_name=excluded.full_name,
    email=excluded.email,
    phone=excluded.phone,
    status='active',
    updated_at=now();

  insert into public.conference_subscriptions(conference_id)
  values(v_conference_id)
  on conflict(conference_id) do nothing;

  insert into public.seasons(
    conference_id,name,starts_on,ends_on,registration_open,setup_stage,preseason_ready,players_per_team
  )
  values(
    v_conference_id,'Cardio Friday Season IV','2026-08-21','2026-10-09',false,7,true,15
  )
  on conflict(conference_id,name) do update set
    starts_on=excluded.starts_on,
    ends_on=excluded.ends_on,
    registration_open=false,
    setup_stage=7,
    preseason_ready=true,
    players_per_team=15
  returning id into v_season_id;

  insert into public.divisions(season_id,name)
  values(v_season_id,'East'),(v_season_id,'West'),(v_season_id,'40 Over')
  on conflict(season_id,name) do nothing;

  select id into v_east_id from public.divisions where season_id=v_season_id and name='East';
  select id into v_west_id from public.divisions where season_id=v_season_id and name='West';
  select id into v_over40_id from public.divisions where season_id=v_season_id and name='40 Over';

  insert into public.teams(division_id,name)
  select v_east_id,demo.team_name from unnest(array[
    'Lawpacs','Adept Junk Removal','Messiah','Remy Boyz','James','Tonton'
  ]) as demo(team_name)
  on conflict(division_id,name) do update set active=true;

  insert into public.teams(division_id,name)
  select v_west_id,demo.team_name from unnest(array[
    'Showtime','Boss Amo','Mike F','Emerald Grind'
  ]) as demo(team_name)
  on conflict(division_id,name) do update set active=true;

  insert into public.teams(division_id,name)
  select v_over40_id,demo.team_name from unnest(array[
    'Team V North','Game Face Visual','BEW','RJ12 Ryan','Magenta Ballers','Trinity Travel','Team Alex'
  ]) as demo(team_name)
  on conflict(division_id,name) do update set active=true;

  insert into public.division_financial_settings(
    division_id,league_fee_enabled,league_fee_cents,uniform_fee_enabled,uniform_fee_cents,platform_fee_cents,updated_by
  )
  values
    (v_east_id,true,11000,true,5000,0,v_owner_profile_id),
    (v_west_id,true,11000,true,5000,0,v_owner_profile_id),
    (v_over40_id,true,11000,true,5000,0,v_owner_profile_id)
  on conflict(division_id) do update set
    league_fee_enabled=true,
    league_fee_cents=11000,
    uniform_fee_enabled=true,
    uniform_fee_cents=5000,
    platform_fee_cents=0,
    updated_at=now(),
    updated_by=v_owner_profile_id;

  insert into public.player_profiles(public_player_id,display_name,email,mobile)
  select public_id,player_name,email,mobile
  from (values
    ('WAP-MAG-ALVIN','Alvin S','alvin.s.wapinoy@example.invalid','+1 206-555-0101'),
    ('WAP-MAG-ALI','Ali','ali.wapinoy@example.invalid','+1 206-555-0102'),
    ('WAP-MAG-ARNOLD','Arnold','arnold.wapinoy@example.invalid','+1 206-555-0103'),
    ('WAP-MAG-ONN','Onn','onn.wapinoy@example.invalid','+1 206-555-0104'),
    ('WAP-MAG-MARLON','Marlon','marlon.wapinoy@example.invalid','+1 206-555-0105'),
    ('WAP-MAG-LEROY','Le Roy','leroy.wapinoy@example.invalid','+1 206-555-0106'),
    ('WAP-MAG-HENRY','Henry L','henry.l.wapinoy@example.invalid','+1 206-555-0107'),
    ('WAP-MAG-PATRICK','Patrick L','patrick.l.wapinoy@example.invalid','+1 206-555-0108'),
    ('WAP-MAG-JOSEPH','Joseph A','joseph.a.wapinoy@example.invalid','+1 206-555-0109')
  ) as demo(public_id,player_name,email,mobile)
  on conflict(public_player_id) do update set
    display_name=excluded.display_name,
    email=excluded.email,
    mobile=excluded.mobile;

  insert into public.conference_player_pool(conference_id,player_id,status)
  select v_conference_id,player.id,'active'
  from public.player_profiles player
  where player.id=v_owner_player_id
     or player.public_player_id in (
       'WAP-MAG-ALVIN','WAP-MAG-ALI','WAP-MAG-ARNOLD','WAP-MAG-ONN','WAP-MAG-MARLON',
       'WAP-MAG-LEROY','WAP-MAG-HENRY','WAP-MAG-PATRICK','WAP-MAG-JOSEPH'
     )
  on conflict(conference_id,player_id) do update set status='active',updated_at=now();

  insert into public.registrations(player_id,season_id,division_id,team_id,status,role_label)
  select player.id,v_season_id,v_over40_id,team.id,'active',demo.role_label
  from (values
    ('WAP-MAG-ALVIN','Captain'),
    ('WAP-MAG-ALI','Player'),
    ('WAP-MAG-ARNOLD','Player'),
    ('WAP-MAG-ONN','Player'),
    ('WAP-MAG-MARLON','Player'),
    ('WAP-MAG-LEROY','Player'),
    ('WAP-MAG-HENRY','Player'),
    ('WAP-MAG-PATRICK','Player'),
    ('WAP-MAG-JOSEPH','Player')
  ) as demo(public_id,role_label)
  join public.player_profiles player on player.public_player_id=demo.public_id
  join public.teams team on team.division_id=v_over40_id and team.name='Magenta Ballers'
  on conflict(player_id,season_id,division_id) where division_id is not null do update set
    team_id=excluded.team_id,status='active',role_label=excluded.role_label;

  insert into public.registrations(player_id,season_id,division_id,team_id,status,role_label)
  select v_owner_player_id,v_season_id,v_over40_id,team.id,'active','Co-captain'
  from public.teams team
  where team.division_id=v_over40_id and team.name='Magenta Ballers'
  on conflict(player_id,season_id,division_id) where division_id is not null do update set
    team_id=excluded.team_id,status='active',role_label='Co-captain';

  insert into public.fees(registration_id,category,description,amount_cents,status,due_on)
  select registration.id,'league','40 Over League Fee',11000,'due','2026-08-21'
  from public.registrations registration
  where registration.season_id=v_season_id and registration.division_id=v_over40_id
    and not exists(select 1 from public.fees fee where fee.registration_id=registration.id and fee.category='league');

  insert into public.fees(registration_id,category,description,amount_cents,status,due_on)
  select registration.id,'uniform','40 Over Uniform Fee',5000,'due','2026-08-21'
  from public.registrations registration
  where registration.season_id=v_season_id and registration.division_id=v_over40_id
    and not exists(select 1 from public.fees fee where fee.registration_id=registration.id and fee.category='uniform');

  insert into public.payments(registration_id,fee_id,amount_cents,method,recorded_by,paid_at,note)
  select registration.id,null,
    case when registration.player_id=v_owner_player_id then 6000 else 16000 end,
    'cash',v_owner_profile_id,'2026-08-21 12:00:00-07','WAPinoy demo cash payment'
  from public.registrations registration
  where registration.season_id=v_season_id and registration.division_id=v_over40_id
    and not exists(
      select 1 from public.payments payment
      where payment.registration_id=registration.id and payment.note='WAPinoy demo cash payment'
    );

  update public.fees fee
  set status=case when registration.player_id=v_owner_player_id then 'due'::public.fee_status else 'paid'::public.fee_status end
  from public.registrations registration
  where fee.registration_id=registration.id
    and registration.season_id=v_season_id
    and registration.division_id=v_over40_id
    and fee.category in ('league','uniform');

  insert into public.games(season_id,home_team_id,away_team_id,starts_at,venue,court,home_uniform,away_uniform,status,phase)
  select v_season_id,home_team.id,away_team.id,
    seed.starts_local at time zone 'America/Los_Angeles',
    'Kentridge High School',seed.court,'White','Dark','scheduled','regular'
  from (values
    -- Flyer: East and West, August 28.
    ('Lawpacs','Adept Junk Removal','2026-08-28 18:00'::timestamp,'Max - Main Gym 1'),
    ('Messiah','Remy Boyz','2026-08-28 19:00'::timestamp,'Max - Main Gym 1'),
    ('James','Tonton','2026-08-28 18:00'::timestamp,'Lawrence - East Gym'),
    ('Showtime','Boss Amo','2026-08-28 18:00'::timestamp,'Joan - Main Gym 2'),
    ('Mike F','Emerald Grind','2026-08-28 19:00'::timestamp,'Joan - Main Gym 2')
  ) as seed(home_name,away_name,starts_local,court)
  join public.teams home_team on home_team.name=seed.home_name and home_team.division_id in(v_east_id,v_west_id)
  join public.teams away_team on away_team.name=seed.away_name and away_team.division_id=home_team.division_id
  where not exists(select 1 from public.games game where game.season_id=v_season_id and game.home_team_id=home_team.id and game.away_team_id=away_team.id and game.starts_at=seed.starts_local at time zone 'America/Los_Angeles');

  insert into public.games(season_id,home_team_id,away_team_id,starts_at,venue,court,home_uniform,away_uniform,status,phase)
  select v_season_id,home_team.id,away_team.id,
    seed.starts_local at time zone 'America/Los_Angeles',
    'Kentridge High School',seed.court,'White','Dark','scheduled','regular'
  from (values
    -- Spreadsheet: 40 Over full schedule. Each date uses the three Kentridge gym slots.
    ('Game Face Visual','Magenta Ballers','2026-08-21 18:00'::timestamp,'Max - Main Gym 1'),
    ('RJ12 Ryan','Trinity Travel','2026-08-21 19:00'::timestamp,'Joan - Main Gym 2'),
    ('BEW','Team Alex','2026-08-21 20:00'::timestamp,'Lawrence - East Gym'),
    ('Team V North','Game Face Visual','2026-08-28 18:00'::timestamp,'Max - Main Gym 1'),
    ('RJ12 Ryan','BEW','2026-08-28 19:00'::timestamp,'Joan - Main Gym 2'),
    ('Magenta Ballers','Team Alex','2026-08-28 20:00'::timestamp,'Lawrence - East Gym'),
    ('Game Face Visual','Team Alex','2026-09-11 18:00'::timestamp,'Max - Main Gym 1'),
    ('RJ12 Ryan','Team V North','2026-09-11 19:00'::timestamp,'Joan - Main Gym 2'),
    ('Magenta Ballers','Trinity Travel','2026-09-11 20:00'::timestamp,'Lawrence - East Gym'),
    ('Game Face Visual','RJ12 Ryan','2026-09-18 18:00'::timestamp,'Max - Main Gym 1'),
    ('Team V North','Magenta Ballers','2026-09-18 19:00'::timestamp,'Joan - Main Gym 2'),
    ('BEW','Trinity Travel','2026-09-18 20:00'::timestamp,'Lawrence - East Gym'),
    ('Game Face Visual','Trinity Travel','2026-09-25 18:00'::timestamp,'Max - Main Gym 1'),
    ('Team V North','Team Alex','2026-09-25 19:00'::timestamp,'Joan - Main Gym 2'),
    ('Magenta Ballers','BEW','2026-09-25 20:00'::timestamp,'Lawrence - East Gym'),
    ('RJ12 Ryan','Magenta Ballers','2026-10-02 18:00'::timestamp,'Max - Main Gym 1'),
    ('Team V North','BEW','2026-10-02 19:00'::timestamp,'Joan - Main Gym 2'),
    ('Trinity Travel','Team Alex','2026-10-02 20:00'::timestamp,'Lawrence - East Gym'),
    ('Game Face Visual','BEW','2026-10-09 18:00'::timestamp,'Max - Main Gym 1'),
    ('RJ12 Ryan','Team Alex','2026-10-09 19:00'::timestamp,'Joan - Main Gym 2'),
    ('Team V North','Trinity Travel','2026-10-09 20:00'::timestamp,'Lawrence - East Gym')
  ) as seed(home_name,away_name,starts_local,court)
  join public.teams home_team on home_team.name=seed.home_name and home_team.division_id=v_over40_id
  join public.teams away_team on away_team.name=seed.away_name and away_team.division_id=v_over40_id
  where not exists(select 1 from public.games game where game.season_id=v_season_id and game.home_team_id=home_team.id and game.away_team_id=away_team.id and game.starts_at=seed.starts_local at time zone 'America/Los_Angeles');

  insert into public.division_schedule_workflows(division_id,mode,status,finalized_at,updated_by)
  values
    (v_east_id,'manual','final',now(),v_owner_profile_id),
    (v_west_id,'manual','final',now(),v_owner_profile_id),
    (v_over40_id,'manual','final',now(),v_owner_profile_id)
  on conflict(division_id) do update set
    mode='manual',
    status='final',
    finalized_at=now(),
    updated_at=now(),
    updated_by=excluded.updated_by;

  insert into public.activity_log(conference_id,actor_profile_id,action,entity_type,entity_id,summary)
  values(v_conference_id,v_owner_profile_id,'create','conference_demo',v_conference_id::text,'Created WAPinoy demo conference and Magenta Ballers roster.');
end;
$$;
