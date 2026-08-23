-- TEST DATA ONLY. Connects one Auth login to an unclaimed drafted player.
-- First create and auto-confirm kch.player.review@example.com in Supabase Authentication > Users.

do $$
declare
  v_login_profile_id uuid;
  v_generated_player_id uuid;
  v_roster_player_id uuid;
  v_conference_id uuid;
  v_player_name text;
begin
  select auth_user.id into v_login_profile_id
  from auth.users auth_user
  where lower(auth_user.email)=lower('kch.player.review@example.com')
  limit 1;
  if v_login_profile_id is null then
    raise exception 'Create and auto-confirm kch.player.review@example.com in Authentication > Users first.';
  end if;

  select player.id into v_generated_player_id
  from public.player_profiles player
  where player.profile_id=v_login_profile_id
  limit 1;

  select registration.player_id,season.conference_id into v_roster_player_id,v_conference_id
  from public.registrations registration
  join public.teams team on team.id=registration.team_id
  join public.divisions division on division.id=team.division_id
  join public.seasons season on season.id=division.season_id
  join public.conferences conference on conference.id=season.conference_id
  where conference.is_test
    and registration.status='active'
    and registration.team_id is not null
    and (
      registration.player_id=v_generated_player_id
      or exists(select 1 from public.player_profiles player where player.id=registration.player_id and player.profile_id is null)
    )
    and exists(select 1 from public.season_broadcasts broadcast where broadcast.division_id=division.id and broadcast.broadcast_type='roster_draft')
  order by case when registration.player_id=v_generated_player_id then 0 else 1 end,team.name,registration.jersey_number nulls last
  limit 1;
  if v_roster_player_id is null then
    raise exception 'No unclaimed player was found in a shared test roster.';
  end if;

  if v_generated_player_id is not null and v_generated_player_id<>v_roster_player_id then
    delete from public.player_profiles player where player.id=v_generated_player_id;
  end if;
  update public.player_profiles player
  set profile_id=v_login_profile_id,email='kch.player.review@example.com'
  where player.id=v_roster_player_id
  returning player.display_name into v_player_name;
  update public.profiles profile set display_name=v_player_name where profile.id=v_login_profile_id;
  insert into public.conference_memberships(conference_id,profile_id,role)
  values(v_conference_id,v_login_profile_id,'player')
  on conflict(conference_id,profile_id,role) do nothing;
end;
$$;

select player.display_name as player_account,team.name as team,division.name as division,season.name as season
from auth.users auth_user
join public.player_profiles player on player.profile_id=auth_user.id
join public.registrations registration on registration.player_id=player.id and registration.status='active'
join public.teams team on team.id=registration.team_id
join public.divisions division on division.id=team.division_id
join public.seasons season on season.id=division.season_id
where lower(auth_user.email)=lower('kch.player.review@example.com');
