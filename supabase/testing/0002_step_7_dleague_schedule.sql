-- TEST DATA ONLY. Never apply this file to a production KCH database.
-- Expands the existing Fall 2026 switcher test into a completed D-League
-- roster draft (Step 6), allowing the owner to test the Step 7 scheduler.
-- Safe to run repeatedly. Re-running removes only this test season's games
-- so a new working schedule can be generated again.

do $$
declare
  v_profile_id uuid;
  v_owner_player_id uuid;
  v_conference_id uuid;
  v_season_id uuid;
  v_division_id uuid;
  v_trinity_id uuid;
begin
  select profile.id
    into v_profile_id
  from public.profiles profile
  join public.player_profiles player on player.profile_id = profile.id
  order by profile.created_at
  limit 1;

  if v_profile_id is null then
    raise exception 'Create a KCH player profile before running this test.';
  end if;

  select player.id into v_owner_player_id
  from public.player_profiles player
  where player.profile_id = v_profile_id;

  select conference.id into v_conference_id
  from public.conferences conference
  where conference.slug = 'seattle-filipino-basketball-league';

  if v_conference_id is null then
    raise exception 'Run the first KCH conference setup before this test.';
  end if;

  insert into public.seasons
    (conference_id, name, starts_on, ends_on, registration_open, setup_stage, players_per_team)
  values
    (v_conference_id, 'Fall 2026 — Switcher Test', '2026-09-01', '2026-12-31', false, 6, 10)
  on conflict (conference_id, name) do update
    set starts_on = excluded.starts_on,
        ends_on = excluded.ends_on,
        registration_open = false,
        setup_stage = 6,
        players_per_team = 10,
        archived_at = null,
        canceled_at = null,
        cancellation_reason = null
  returning id into v_season_id;

  insert into public.divisions (season_id, name)
  values (v_season_id, 'D-League')
  on conflict (season_id, name) do update set name = excluded.name
  returning id into v_division_id;

  insert into public.teams (division_id, name, active)
  select v_division_id, team_name, true
  from unnest(array[
    'Kurious Joe [TEST]',
    'CBA [TEST]',
    'Beautiful Living [TEST]',
    'AngelesCareHomes [TEST]',
    'ABM HomeCare [TEST]',
    'J&J Integrity [TEST]',
    'All-In [TEST]',
    'Jess Auto Repair [TEST]',
    'ElvinHouseRemodeling [TEST]',
    'Trinity Travel [TEST]'
  ]) as team_name
  on conflict (division_id, name) do update set active = true;

  create temporary table kch_step7_roster (
    test_id text primary key,
    team_name text not null,
    player_name text not null,
    jersey_number integer,
    role_label text not null
  ) on commit drop;

  -- The first two highlighted names on each supplied roster are treated as
  -- Captain and Co-captain. The supplied Overall number is used as jersey.
  insert into kch_step7_roster values
    ('001','Kurious Joe [TEST]','Roel Miranda',null,'Captain'),
    ('002','Kurious Joe [TEST]','Ricky Ancheta',null,'Co-captain'),
    ('003','Kurious Joe [TEST]','Nelson Asirot',null,'Player'),
    ('004','Kurious Joe [TEST]','Ompong Laxa',null,'Player'),
    ('005','Kurious Joe [TEST]','Nani Esclamado',null,'Player'),
    ('006','Kurious Joe [TEST]','Jason Oximana',null,'Player'),
    ('007','Kurious Joe [TEST]','Joe Panit',null,'Player'),
    ('008','Kurious Joe [TEST]','Rom Torio',null,'Player'),
    ('009','Kurious Joe [TEST]','Fral Aling',null,'Player'),

    ('010','CBA [TEST]','Nick Casanova',null,'Captain'),
    ('011','CBA [TEST]','Edison Navaluna',null,'Co-captain'),
    ('012','CBA [TEST]','Joevin Gonzales',1,'Player'),
    ('013','CBA [TEST]','Junior Fabro',18,'Player'),
    ('014','CBA [TEST]','Rey Mosuela',19,'Player'),
    ('015','CBA [TEST]','Mel Lorica',36,'Player'),
    ('016','CBA [TEST]','Ken Viernes',37,'Player'),
    ('017','CBA [TEST]','George dela Cruz',54,'Player'),
    ('018','CBA [TEST]','Mike Soriano',55,'Player'),

    ('019','Beautiful Living [TEST]','Chris Newton',null,'Captain'),
    ('020','Beautiful Living [TEST]','Dennis Harrison',null,'Co-captain'),
    ('021','Beautiful Living [TEST]','Conel Yanos',2,'Player'),
    ('022','Beautiful Living [TEST]','Bong Hoyla',17,'Player'),
    ('023','Beautiful Living [TEST]','Ricky Matinas',20,'Player'),
    ('024','Beautiful Living [TEST]','Isaac Cambronero',35,'Player'),
    ('025','Beautiful Living [TEST]','Alex Cambronero',38,'Player'),
    ('026','Beautiful Living [TEST]','Ray Hecita',53,'Player'),
    ('027','Beautiful Living [TEST]','Marcos Pollo',56,'Player'),

    ('028','AngelesCareHomes [TEST]','Marlon Moriones',null,'Captain'),
    ('029','AngelesCareHomes [TEST]','Ricky Rualo',null,'Co-captain'),
    ('030','AngelesCareHomes [TEST]','Jerome Angeles',3,'Player'),
    ('031','AngelesCareHomes [TEST]','Warren Julve',16,'Player'),
    ('032','AngelesCareHomes [TEST]','Allain Arnedo',21,'Player'),
    ('033','AngelesCareHomes [TEST]','RB Bobadilla',34,'Player'),
    ('034','AngelesCareHomes [TEST]','Eric Magat',39,'Player'),
    ('035','AngelesCareHomes [TEST]','Jay Carreon',52,'Player'),
    ('036','AngelesCareHomes [TEST]','Ed Gozun',57,'Player'),

    ('037','ABM HomeCare [TEST]','Bennett Reyes',null,'Captain'),
    ('038','ABM HomeCare [TEST]','Mike Jang',null,'Co-captain'),
    ('039','ABM HomeCare [TEST]','Joe Cunanan',4,'Player'),
    ('040','ABM HomeCare [TEST]','Dinand Basconcillo',15,'Player'),
    ('041','ABM HomeCare [TEST]','Jason Olivar',22,'Player'),
    ('042','ABM HomeCare [TEST]','Fred Abonita',33,'Player'),
    ('043','ABM HomeCare [TEST]','Nome McCaffrey',40,'Player'),
    ('044','ABM HomeCare [TEST]','Noli Fabrigas',51,'Player'),
    ('045','ABM HomeCare [TEST]','Ferddi Martin',58,'Player'),
    ('046','ABM HomeCare [TEST]','Bert Gonzales',null,'Player'),

    ('047','J&J Integrity [TEST]','Sam Medina',null,'Captain'),
    ('048','J&J Integrity [TEST]','Jovan Layug',null,'Co-captain'),
    ('049','J&J Integrity [TEST]','Joseph Enriquez',5,'Player'),
    ('050','J&J Integrity [TEST]','Romuel Guce',14,'Player'),
    ('051','J&J Integrity [TEST]','Derick Dizon',23,'Player'),
    ('052','J&J Integrity [TEST]','Mario Ayson',32,'Player'),
    ('053','J&J Integrity [TEST]','Marion Asirot',41,'Player'),

    ('054','All-In [TEST]','Jerald Lazo',null,'Captain'),
    ('055','All-In [TEST]','Sherwin Mendoza',null,'Co-captain'),
    ('056','All-In [TEST]','Richard Jones',6,'Player'),
    ('057','All-In [TEST]','Ed Ordiz',13,'Player'),
    ('058','All-In [TEST]','Jay Kenyon',24,'Player'),
    ('059','All-In [TEST]','Erik David',31,'Player'),
    ('060','All-In [TEST]','Von Conde',42,'Player'),
    ('061','All-In [TEST]','Wenwen Candelaria',49,'Player'),
    ('062','All-In [TEST]','Dave Paris',59,'Player'),

    ('063','Jess Auto Repair [TEST]','Godfrey Leung',null,'Captain'),
    ('064','Jess Auto Repair [TEST]','Fuji Flores',null,'Co-captain'),
    ('065','Jess Auto Repair [TEST]','An Dam',7,'Player'),
    ('066','Jess Auto Repair [TEST]','Joel Aguirre',12,'Player'),
    ('067','Jess Auto Repair [TEST]','Jhun Lagmay',25,'Player'),
    ('068','Jess Auto Repair [TEST]','Sherwin Cardona',30,'Player'),
    ('069','Jess Auto Repair [TEST]','Ulee Rambayon',43,'Player'),
    ('070','Jess Auto Repair [TEST]','Cris Martinez',48,'Player'),
    ('071','Jess Auto Repair [TEST]','Jessie Din',null,'Player'),

    ('072','ElvinHouseRemodeling [TEST]','James Dimacali',null,'Captain'),
    ('073','ElvinHouseRemodeling [TEST]','Philip Go',null,'Co-captain'),
    ('074','ElvinHouseRemodeling [TEST]','Mike Nunez',8,'Player'),
    ('075','ElvinHouseRemodeling [TEST]','Erick Isip',11,'Player'),
    ('076','ElvinHouseRemodeling [TEST]','Jack Guanzon',26,'Player'),
    ('077','ElvinHouseRemodeling [TEST]','Manny Galang',29,'Player'),
    ('078','ElvinHouseRemodeling [TEST]','Aris Macarayo',44,'Player'),
    ('079','ElvinHouseRemodeling [TEST]','Henry Pacheco',47,'Player'),
    ('080','ElvinHouseRemodeling [TEST]','Trini Polintan',60,'Player'),

    ('081','Trinity Travel [TEST]','Winston Keys',null,'Captain'),
    ('082','Trinity Travel [TEST]','Fritz Rigor',null,'Co-captain'),
    ('083','Trinity Travel [TEST]','Lennon del Rosario',9,'Player'),
    ('084','Trinity Travel [TEST]','Tony Davis',10,'Player'),
    ('085','Trinity Travel [TEST]','Alvin Sabas',27,'Player'),
    ('086','Trinity Travel [TEST]','Bong Mendoza',45,'Player'),
    ('087','Trinity Travel [TEST]','Red San Buenaventura',46,'Player'),
    ('088','Trinity Travel [TEST]','Neph Appostol',60,'Player');

  insert into public.player_profiles (public_player_id, display_name)
  select 'KCH-DL-T7-' || roster.test_id, roster.player_name
  from kch_step7_roster roster
  on conflict (public_player_id) do update
    set display_name = excluded.display_name;

  insert into public.registrations
    (player_id, season_id, team_id, status, jersey_number, position, role_label)
  select player.id, v_season_id, team.id, 'active', roster.jersey_number, null, roster.role_label
  from kch_step7_roster roster
  join public.player_profiles player
    on player.public_player_id = 'KCH-DL-T7-' || roster.test_id
  join public.teams team
    on team.division_id = v_division_id and team.name = roster.team_name
  on conflict (player_id, season_id) do update
    set team_id = excluded.team_id,
        status = 'active',
        jersey_number = excluded.jersey_number,
        position = null,
        role_label = excluded.role_label;

  select team.id into v_trinity_id
  from public.teams team
  where team.division_id = v_division_id
    and team.name = 'Trinity Travel [TEST]';

  -- Keep the signed-in test owner/player as Paul Lazarte (#28) instead of
  -- creating a duplicate unclaimed roster profile.
  insert into public.registrations
    (player_id, season_id, team_id, status, jersey_number, position, role_label)
  values
    (v_owner_player_id, v_season_id, v_trinity_id, 'active', 28, 'Forward', 'Player')
  on conflict (player_id, season_id) do update
    set team_id = excluded.team_id,
        status = 'active',
        jersey_number = 28,
        position = 'Forward',
        role_label = 'Player';

  -- Reset only the disposable test schedule so Step 7 can be exercised again.
  delete from public.games where season_id = v_season_id;
end $$;

select
  season.name as test_season,
  division.name as division,
  count(distinct team.id) as teams,
  count(registration.id) as rostered_players,
  count(*) filter (where registration.role_label = 'Captain') as captains,
  count(*) filter (where registration.role_label = 'Co-captain') as co_captains,
  season.setup_stage
from public.seasons season
join public.divisions division on division.season_id = season.id
join public.teams team on team.division_id = division.id and team.active
left join public.registrations registration
  on registration.team_id = team.id and registration.season_id = season.id and registration.status = 'active'
where season.name = 'Fall 2026 — Switcher Test'
group by season.name, division.name, season.setup_stage;
