-- Import the source roster for WAPinoy / Cardio Friday Season IV / 40 Over.
-- Only Paul Lazarte remains connected to a KCH login. All other records are unclaimed.

do $$
declare
  v_conference_id uuid;
  v_season_id uuid;
  v_division_id uuid;
  v_owner_profile_id uuid;
begin
  select id into v_conference_id from public.conferences where slug='wapinoy';
  select id into v_season_id from public.seasons where conference_id=v_conference_id and name='Cardio Friday Season IV';
  select id into v_division_id from public.divisions where season_id=v_season_id and name='40 Over';
  select profile_id into v_owner_profile_id from public.platform_owner_records where conference_id=v_conference_id;

  if v_conference_id is null or v_season_id is null or v_division_id is null or v_owner_profile_id is null then
    raise exception 'WAPinoy Cardio Friday Season IV / 40 Over was not found.';
  end if;

  -- Retain the existing team IDs so the imported schedule continues to point to the right teams.
  update public.teams set name=case name
    when 'Team V North' then 'Andrei North'
    when 'Game Face Visual' then 'Gameface Vizual'
    when 'BEW' then 'Basketball Everyday'
    when 'RJ12 Ryan' then 'RJ12'
    when 'Team Alex' then 'Alex'
    else name
  end
  where division_id=v_division_id;

  -- Remove only the temporary Magenta placeholders created by the WAPinoy demo seed.
  delete from public.player_profiles where public_player_id like 'WAP-MAG-%';

  create temporary table wapinoy_roster(
    public_id text primary key,
    team_name text not null,
    player_name text not null,
    jersey_number integer,
    role_label text not null default 'Player',
    owes_balance boolean not null default false
  ) on commit drop;

  insert into wapinoy_roster(public_id,team_name,player_name,jersey_number,role_label,owes_balance) values
    ('WAP-TRI-012','Trinity Travel','Brian Celestino',12,'Player',false),
    ('WAP-TRI-007','Trinity Travel','Emerson Urbano',7,'Player',false),
    ('WAP-TRI-003','Trinity Travel','John Saganova',3,'Player',false),
    ('WAP-TRI-011','Trinity Travel','Mark Macapios',11,'Player',true),
    ('WAP-TRI-048','Trinity Travel','Mhar Salvador',48,'Player',false),
    ('WAP-TRI-001','Trinity Travel','Mike Aro',1,'Player',false),
    ('WAP-TRI-024','Trinity Travel','Nelson Asirot',24,'Player',false),
    ('WAP-TRI-023','Trinity Travel','Neph Apostol',23,'Player',false),
    ('WAP-TRI-022','Trinity Travel','Noel Pascual',22,'Player',false),
    ('WAP-TRI-051','Trinity Travel','Winston Keys',51,'Player',false),

    ('WAP-MAG-007','Magenta Ballers','Ali Saad',7,'Player',false),
    ('WAP-MAG-020','Magenta Ballers','Alvin Sabas',20,'Captain',false),
    ('WAP-MAG-008','Magenta Ballers','Arnold Catanag',8,'Player',false),
    ('WAP-MAG-088','Magenta Ballers','Henry Laygo',88,'Player',false),
    ('WAP-MAG-052','Magenta Ballers','Jack Acosta',52,'Player',false),
    ('WAP-MAG-003','Magenta Ballers','Jojo Santor',3,'Player',false),
    ('WAP-MAG-024','Magenta Ballers','Leroy Munar',24,'Player',false),
    ('WAP-MAG-017','Magenta Ballers','Marlon Moriones',17,'Player',false),
    ('WAP-MAG-010','Magenta Ballers','Onn Lee',10,'Player',false),
    ('WAP-MAG-021','Magenta Ballers','Patrick Laygo',21,'Player',false),

    ('WAP-RJ12-022','RJ12','Avelon Roman',22,'Player',false),
    ('WAP-RJ12-016','RJ12','Carlito Mendiola',16,'Player',false),
    ('WAP-RJ12-008','RJ12','Dwayne Rowell',8,'Player',true),
    ('WAP-RJ12-010','RJ12','Frederick Azul',10,'Player',false),
    ('WAP-RJ12-006','RJ12','Gadansk Corpin',6,'Player',false),
    ('WAP-RJ12-003','RJ12','MJ Aguinaldo',3,'Player',false),
    ('WAP-RJ12-077','RJ12','Patricio Badong',77,'Player',false),
    ('WAP-RJ12-061','RJ12','Peredo Sixty One Not One',61,'Player',false),
    ('WAP-RJ12-007','RJ12','Ronald Ramirez',7,'Player',false),
    ('WAP-RJ12-009','RJ12','Ryan Madera',9,'Player',false),
    ('WAP-RJ12-014','RJ12','Suki d Goat',14,'Player',false),

    ('WAP-ALEX-015','Alex','Albert Ching',15,'Player',false),
    ('WAP-ALEX-021','Alex','Alex Biranoco',21,'Player',false),
    ('WAP-ALEX-018','Alex','Christian Obis',18,'Player',false),
    ('WAP-ALEX-008','Alex','Edel Cagape',8,'Player',false),
    ('WAP-ALEX-035','Alex','Jamez Zarlan',35,'Player',false),
    ('WAP-ALEX-041','Alex','Jeff Perry',41,'Player',true),
    ('WAP-ALEX-001','Alex','Jim Julian',1,'Player',false),
    ('WAP-ALEX-024','Alex','Kimpoy',24,'Player',false),
    ('WAP-ALEX-011','Alex','Mike Justiniano',11,'Player',false),
    ('WAP-ALEX-020','Alex','Nel Sicat',20,'Player',false),
    ('WAP-ALEX-009','Alex','Ryan Madera',9,'Player',false),
    ('WAP-ALEX-033','Alex','Stephen Garcia',33,'Player',false),
    ('WAP-ALEX-016','Alex','Yuk Icab',16,'Player',false),

    ('WAP-AND-091','Andrei North','Paul Dorrel',91,'Player',false),
    ('WAP-AND-028','Andrei North','Andrei Altamirano',28,'Player',false),
    ('WAP-AND-032','Andrei North','Benneth Reyes',32,'Player',false),
    ('WAP-AND-013','Andrei North','Erik David',13,'Player',false),
    ('WAP-AND-021','Andrei North','Jake Luanes',21,'Player',true),
    ('WAP-AND-011','Andrei North','Jerald Lazo',11,'Player',false),
    ('WAP-AND-001','Andrei North','Joe Gallardo',1,'Player',false),
    ('WAP-AND-014','Andrei North','Lennon del Rosario',14,'Player',false),
    ('WAP-AND-002','Andrei North','Michael Lataquinn',2,'Player',false),
    ('WAP-AND-003','Andrei North','Steve Chon',3,'Player',false),
    ('WAP-AND-005','Andrei North','Steve Kwan',5,'Player',false),

    ('WAP-BEW-023','Basketball Everyday','Clarido Sienes',23,'Player',false),
    ('WAP-BEW-036','Basketball Everyday','Dan Abalus',36,'Player',false),
    ('WAP-BEW-000','Basketball Everyday','JayR Almaria',0,'Player',false),
    ('WAP-BEW-003','Basketball Everyday','Johnfel Esquivel',3,'Player',false),
    ('WAP-BEW-069','Basketball Everyday','Kernel Garcia',69,'Player',false),
    ('WAP-BEW-008','Basketball Everyday','Nino Jerome David',8,'Player',true),
    ('WAP-BEW-033','Basketball Everyday','Ralph Pidong Marzan',33,'Player',false),
    ('WAP-BEW-006','Basketball Everyday','Rex King',6,'Player',false),
    ('WAP-BEW-050','Basketball Everyday','Ron Jabasa',50,'Player',false),
    ('WAP-BEW-016','Basketball Everyday','Vern Cabiga',16,'Player',false),

    ('WAP-GFV-003','Gameface Vizual','Cris Pulmones',3,'Player',false),
    ('WAP-GFV-008','Gameface Vizual','Jem Lacorte',8,'Player',false),
    ('WAP-GFV-011','Gameface Vizual','Jesse',11,'Player',false),
    ('WAP-GFV-014','Gameface Vizual','Joe Cabrera',14,'Player',false),
    ('WAP-GFV-000','Gameface Vizual','Joe Garcia',0,'Player',true),
    ('WAP-GFV-024','Gameface Vizual','Mark Ridao',24,'Player',false),
    ('WAP-GFV-017','Gameface Vizual','Noel Nodalo',17,'Player',false),
    ('WAP-GFV-001','Gameface Vizual','Ojay Dalere',1,'Player',false),
    ('WAP-GFV-012','Gameface Vizual','Paul Dy Tioco',12,'Player',false),
    ('WAP-GFV-010','Gameface Vizual','Von Bolante',10,'Player',false);

  insert into public.player_profiles(public_player_id,display_name,email,mobile,claimed_at)
  select public_id,player_name,null,null,null from wapinoy_roster
  on conflict(public_player_id) do update set
    display_name=excluded.display_name,
    email=null,
    mobile=null,
    profile_id=null,
    claimed_at=null;

  insert into public.conference_player_pool(conference_id,player_id,status)
  select v_conference_id,player.id,'active'
  from public.player_profiles player
  join wapinoy_roster roster on roster.public_id=player.public_player_id
  on conflict(conference_id,player_id) do update set status='active',updated_at=now();

  -- The owner is rostered as Paul Lazarte #12 and retains his existing KCH login.
  insert into public.registrations(player_id,season_id,division_id,team_id,status,jersey_number,role_label)
  select player.id,v_season_id,v_division_id,team.id,'active',roster.jersey_number,roster.role_label
  from wapinoy_roster roster
  join public.player_profiles player on player.public_player_id=roster.public_id
  join public.teams team on team.division_id=v_division_id and team.name=roster.team_name
  on conflict(player_id,season_id,division_id) where division_id is not null do update set
    team_id=excluded.team_id,status='active',jersey_number=excluded.jersey_number,role_label=excluded.role_label;

  insert into public.registrations(player_id,season_id,division_id,team_id,status,jersey_number,role_label)
  select player.id,v_season_id,v_division_id,team.id,'active',12,'Co-captain'
  from public.player_profiles player
  join public.teams team on team.division_id=v_division_id and team.name='Magenta Ballers'
  where player.profile_id=v_owner_profile_id
  on conflict(player_id,season_id,division_id) where division_id is not null do update set
    team_id=excluded.team_id,status='active',jersey_number=12,role_label='Co-captain';

  delete from public.payments payment
  using public.registrations registration
  where payment.registration_id=registration.id
    and registration.season_id=v_season_id and registration.division_id=v_division_id;
  delete from public.fees fee
  using public.registrations registration
  where fee.registration_id=registration.id
    and registration.season_id=v_season_id and registration.division_id=v_division_id;

  insert into public.fees(registration_id,category,description,amount_cents,status,due_on)
  select registration.id,'league','40 Over League Fee',11000,'due','2026-08-21'
  from public.registrations registration
  where registration.season_id=v_season_id and registration.division_id=v_division_id;
  insert into public.fees(registration_id,category,description,amount_cents,status,due_on)
  select registration.id,'uniform','40 Over Uniform Fee',5000,'due','2026-08-21'
  from public.registrations registration
  where registration.season_id=v_season_id and registration.division_id=v_division_id;

  insert into public.payments(registration_id,fee_id,amount_cents,method,recorded_by,paid_at,note)
  select registration.id,null,
    case when player.profile_id=v_owner_profile_id or coalesce(roster.owes_balance,false) then 6000 else 16000 end,
    'cash',v_owner_profile_id,'2026-08-21 12:00:00-07','WAPinoy roster import cash payment'
  from public.registrations registration
  join public.player_profiles player on player.id=registration.player_id
  left join wapinoy_roster roster on roster.public_id=player.public_player_id
  where registration.season_id=v_season_id and registration.division_id=v_division_id;

  update public.fees fee
  set status=case when player.profile_id=v_owner_profile_id or coalesce(roster.owes_balance,false) then 'due'::public.fee_status else 'paid'::public.fee_status end
  from public.registrations registration
  join public.player_profiles player on player.id=registration.player_id
  left join wapinoy_roster roster on roster.public_id=player.public_player_id
  where fee.registration_id=registration.id
    and registration.season_id=v_season_id and registration.division_id=v_division_id;

  insert into public.activity_log(conference_id,actor_profile_id,action,entity_type,entity_id,summary)
  values(v_conference_id,v_owner_profile_id,'import','division_roster',v_division_id::text,'Imported the WAPinoy 40 Over source roster and cash-payment demo balances.');
end;
$$;
