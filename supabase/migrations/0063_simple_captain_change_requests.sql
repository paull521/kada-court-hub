create or replace function public.captain_create_roster_request(
  p_team_id uuid,
  p_request_type text,
  p_details text,
  p_registration_id uuid default null,
  p_target_team_id uuid default null,
  p_invitation_id uuid default null
)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_season_id uuid;v_setup_stage smallint;v_request_id uuid;v_details text:=nullif(trim(p_details),'');
begin
  select division.season_id,season.setup_stage into v_season_id,v_setup_stage
  from public.teams team
  join public.divisions division on division.id=team.division_id
  join public.seasons season on season.id=division.season_id
  where team.id=p_team_id;
  if v_season_id is null or not exists(
    select 1 from public.registrations registration
    join public.player_profiles player on player.id=registration.player_id
    where registration.team_id=p_team_id
      and player.profile_id=(select auth.uid())
      and registration.role_label in ('Captain','Co-captain')
  ) then raise exception 'Only this team''s captain or co-captain can submit roster requests.'; end if;
  if v_setup_stage<5 then raise exception 'Roster requests open after the draft begins.'; end if;
  if p_request_type not in ('trade','add_player','remove_player','other') then raise exception 'Choose a valid request type.'; end if;
  if v_details is null or char_length(v_details)>1000 then raise exception 'Enter request details of 1 to 1,000 characters.'; end if;
  insert into public.roster_change_requests(season_id,team_id,requested_by,request_type,details)
  values(v_season_id,p_team_id,(select auth.uid()),p_request_type,v_details)
  returning id into v_request_id;
  return v_request_id;
end;
$$;
