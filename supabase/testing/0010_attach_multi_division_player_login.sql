-- TEST DATA ONLY. Connects one Auth login to a player rostered in two divisions.
-- First create and auto-confirm kch.multidivision@example.com in Supabase Authentication > Users.

do $$
declare
  v_login_profile_id uuid;
  v_generated_player_id uuid;
  v_roster_player_id uuid;
  v_conference_id uuid;
  v_season_id uuid;
  v_existing_division_id uuid;
  v_second_division_id uuid;
  v_second_team_id uuid;
  v_player_name text;
begin
  select auth_user.id into v_login_profile_id from auth.users auth_user
  where lower(auth_user.email)=lower('kch.multidivision@example.com') limit 1;
  if v_login_profile_id is null then raise exception 'Create and auto-confirm kch.multidivision@example.com in Authentication > Users first.'; end if;

  select player.id into v_generated_player_id from public.player_profiles player where player.profile_id=v_login_profile_id limit 1;

  select registration.player_id,min(season.conference_id::text)::uuid into v_roster_player_id,v_conference_id
  from public.registrations registration
  join public.divisions division on division.id=registration.division_id
  join public.seasons season on season.id=division.season_id
  join public.conferences conference on conference.id=season.conference_id
  join public.player_profiles player on player.id=registration.player_id
  where conference.is_test and season.canceled_at is null and registration.status='active' and registration.team_id is not null
    and (player.profile_id is null or player.profile_id=v_login_profile_id)
    and exists(select 1 from public.season_broadcasts broadcast where broadcast.division_id=division.id and broadcast.broadcast_type='roster_draft')
  group by registration.player_id
  having count(distinct registration.division_id)>=2
  order by case when registration.player_id=v_generated_player_id then 0 else 1 end,registration.player_id
  limit 1;
  if v_roster_player_id is null then
    select registration.player_id,registration.season_id,registration.division_id,season.conference_id
    into v_roster_player_id,v_season_id,v_existing_division_id,v_conference_id
    from public.registrations registration
    join public.divisions division on division.id=registration.division_id
    join public.seasons season on season.id=division.season_id
    join public.conferences conference on conference.id=season.conference_id
    join public.player_profiles player on player.id=registration.player_id
    where conference.is_test and season.canceled_at is null and registration.status='active' and registration.team_id is not null
      and player.profile_id is null
      and exists(select 1 from public.season_broadcasts broadcast where broadcast.division_id=division.id and broadcast.broadcast_type='roster_draft')
    order by season.starts_on desc,registration.created_at
    limit 1;
    if v_roster_player_id is null then raise exception 'No unclaimed player was found in a shared test roster.'; end if;

    select division.id into v_second_division_id
    from public.divisions division
    where division.season_id=v_season_id and division.id<>v_existing_division_id
    order by division.name
    limit 1;
    if v_second_division_id is null then raise exception 'A second division was not found in the same test season.'; end if;

    select team.id into v_second_team_id
    from public.teams team
    left join public.registrations registration on registration.team_id=team.id and registration.status='active'
    where team.division_id=v_second_division_id and team.active
    group by team.id,team.name
    order by count(registration.id),team.name
    limit 1;
    if v_second_team_id is null then raise exception 'No active team was found in the second division.'; end if;

    insert into public.registrations(player_id,season_id,division_id,team_id,status,role_label,position)
    values(v_roster_player_id,v_season_id,v_second_division_id,v_second_team_id,'active','Player','Guard')
    on conflict(player_id,season_id,division_id) where division_id is not null do update
    set team_id=excluded.team_id,status='active',role_label='Player',position=coalesce(public.registrations.position,'Guard');
  end if;

  if v_generated_player_id is not null and v_generated_player_id<>v_roster_player_id then
    delete from public.player_profiles player where player.id=v_generated_player_id;
  end if;
  update public.player_profiles player
  set profile_id=v_login_profile_id,email='kch.multidivision@example.com'
  where player.id=v_roster_player_id
  returning player.display_name into v_player_name;
  update public.profiles profile set display_name=v_player_name where profile.id=v_login_profile_id;
  insert into public.conference_memberships(conference_id,profile_id,role)
  values(v_conference_id,v_login_profile_id,'player')
  on conflict(conference_id,profile_id,role) do nothing;
end;
$$;

select player.display_name as player_account,season.name as season,division.name as division,team.name as team,registration.role_label as role
from auth.users auth_user
join public.player_profiles player on player.profile_id=auth_user.id
join public.registrations registration on registration.player_id=player.id and registration.status='active'
join public.teams team on team.id=registration.team_id
join public.divisions division on division.id=team.division_id
join public.seasons season on season.id=division.season_id
where lower(auth_user.email)=lower('kch.multidivision@example.com')
order by season.starts_on desc,division.name;
