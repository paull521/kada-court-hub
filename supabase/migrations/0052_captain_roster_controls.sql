-- Captain roster controls: team-specific jersey details, draft limits, and
-- owner-approved roster actions.

alter table public.registrations add column if not exists jersey_name text;
alter table public.roster_change_requests add column if not exists registration_id uuid references public.registrations(id) on delete set null;
alter table public.roster_change_requests add column if not exists target_team_id uuid references public.teams(id) on delete set null;
alter table public.roster_change_requests add column if not exists invitation_id uuid references public.season_invitations(id) on delete set null;

update public.registrations
set position = case lower(trim(position))
  when 'guard' then 'G' when 'point guard' then 'PG' when 'shooting guard' then 'SG'
  when 'forward' then 'F' when 'power forward' then 'PF' when 'center' then 'C'
  else null end
where position is not null and position not in ('G','SG','PG','F','PF','C');

alter table public.registrations drop constraint if exists registrations_position_check;
alter table public.registrations add constraint registrations_position_check
  check (position is null or position in ('G','SG','PG','F','PF','C'));
alter table public.registrations drop constraint if exists registrations_jersey_name_check;
alter table public.registrations add constraint registrations_jersey_name_check
  check (jersey_name is null or char_length(trim(jersey_name)) between 1 and 24);

drop function if exists public.captain_team_draft_roster(uuid);
create function public.captain_team_draft_roster(p_team_id uuid)
returns table(registration_id uuid,public_player_id text,display_name text,jersey_number integer,player_position text,jersey_name text,role_label text,uniform_size text)
language plpgsql security definer set search_path=''
as $$
begin
  if not exists(select 1 from public.registrations r join public.player_profiles p on p.id=r.player_id where r.team_id=p_team_id and p.profile_id=(select auth.uid()) and r.role_label in ('Captain','Co-captain')) then
    raise exception 'Captain access is required for this team.';
  end if;
  return query select r.id,p.public_player_id,p.display_name,r.jersey_number,r.position,r.jersey_name,r.role_label,p.preferred_uniform_size
  from public.registrations r join public.player_profiles p on p.id=r.player_id
  where r.team_id=p_team_id and r.status<>'inactive'
  order by case when r.role_label='Captain' then 0 when r.role_label='Co-captain' then 1 else 2 end,r.jersey_number nulls last,p.display_name;
end;
$$;
grant execute on function public.captain_team_draft_roster(uuid) to authenticated;

drop function if exists public.captain_save_draft_player(uuid,uuid,integer,text,text);
create function public.captain_save_draft_player(p_team_id uuid,p_invitation_id uuid,p_jersey_number integer default null,p_position text default null,p_uniform_size text default null,p_jersey_name text default null)
returns void language plpgsql security definer set search_path=''
as $$
declare v_division_id uuid;v_registration_id uuid;v_player_id uuid;v_status text;v_limit integer;v_count integer;v_position text:=nullif(trim(p_position),'');v_uniform_size text:=nullif(upper(trim(p_uniform_size)), '');v_jersey_name text:=nullif(trim(p_jersey_name),'');
begin
  select t.division_id,s.players_per_team into v_division_id,v_limit from public.teams t join public.divisions d on d.id=t.division_id join public.seasons s on s.id=d.season_id where t.id=p_team_id;
  if v_division_id is null or not exists(select 1 from public.registrations r join public.player_profiles p on p.id=r.player_id where r.team_id=p_team_id and p.profile_id=(select auth.uid()) and r.role_label in ('Captain','Co-captain')) then raise exception 'Captain access is required for this team.'; end if;
  select coalesce(d.status,'editing') into v_status from public.teams t left join public.team_roster_drafts d on d.team_id=t.id where t.id=p_team_id;
  if v_status in ('submitted','approved') then raise exception 'This roster is locked while it is under owner review.'; end if;
  select i.registration_id,i.player_id into v_registration_id,v_player_id from public.season_invitations i where i.id=p_invitation_id and i.division_id=v_division_id and i.response='joining' and i.selection_status in ('eligible','waitlisted');
  if v_registration_id is null then raise exception 'Choose a player from this division draft list.'; end if;
  select count(*) into v_count from public.registrations where team_id=p_team_id and status<>'inactive';
  if v_limit is not null and v_count>=v_limit then raise exception 'This team is full (% players). Ask the owner to approve an extra roster change.',v_limit; end if;
  if p_jersey_number is not null and (p_jersey_number<0 or p_jersey_number>99) then raise exception 'Jersey number must be from 0 to 99.'; end if;
  if v_position is not null and v_position not in ('G','SG','PG','F','PF','C') then raise exception 'Choose G, SG, PG, F, PF, or C.'; end if;
  if v_uniform_size is not null and v_uniform_size not in ('S','M','L','XL','2XL','3XL') then raise exception 'Choose a listed uniform size.'; end if;
  if v_jersey_name is not null and char_length(v_jersey_name)>24 then raise exception 'Jersey name must be 24 characters or fewer.'; end if;
  if p_jersey_number is not null and exists(select 1 from public.registrations where team_id=p_team_id and jersey_number=p_jersey_number and id<>v_registration_id) then raise exception 'That jersey number is already used on this team.'; end if;
  update public.registrations set team_id=p_team_id,jersey_number=p_jersey_number,position=v_position,jersey_name=v_jersey_name,status='pending' where id=v_registration_id;
  update public.player_profiles set preferred_uniform_size=v_uniform_size where id=v_player_id;
  insert into public.team_roster_drafts(team_id,status,updated_at) values(p_team_id,'editing',now()) on conflict(team_id) do update set status='editing',submitted_at=null,submitted_by=null,reviewed_at=null,reviewed_by=null,owner_note=null,updated_at=now();
end;
$$;
grant execute on function public.captain_save_draft_player(uuid,uuid,integer,text,text,text) to authenticated;

drop function if exists public.captain_update_draft_player(uuid,uuid,integer,text,text,boolean);
create function public.captain_update_draft_player(p_team_id uuid,p_registration_id uuid,p_jersey_number integer default null,p_position text default null,p_uniform_size text default null,p_jersey_name text default null,p_remove boolean default false)
returns void language plpgsql security definer set search_path=''
as $$
declare v_status text;v_player_id uuid;v_position text:=nullif(trim(p_position),'');v_uniform_size text:=nullif(upper(trim(p_uniform_size)), '');v_jersey_name text:=nullif(trim(p_jersey_name),'');
begin
  if not exists(select 1 from public.registrations r join public.player_profiles p on p.id=r.player_id where r.team_id=p_team_id and p.profile_id=(select auth.uid()) and r.role_label in ('Captain','Co-captain')) then raise exception 'Captain access is required for this team.'; end if;
  select coalesce(d.status,'editing') into v_status from public.teams t left join public.team_roster_drafts d on d.team_id=t.id where t.id=p_team_id;
  if v_status in ('submitted','approved') then raise exception 'This roster is locked while it is under owner review.'; end if;
  select player_id into v_player_id from public.registrations where id=p_registration_id and team_id=p_team_id and role_label='Player';
  if v_player_id is null then raise exception 'Choose a drafted player on your team.'; end if;
  if p_remove then
    update public.registrations set team_id=null,jersey_number=null,position=null,jersey_name=null,status='pending' where id=p_registration_id;
  else
    if p_jersey_number is not null and (p_jersey_number<0 or p_jersey_number>99) then raise exception 'Jersey number must be from 0 to 99.'; end if;
    if v_position is not null and v_position not in ('G','SG','PG','F','PF','C') then raise exception 'Choose G, SG, PG, F, PF, or C.'; end if;
    if v_uniform_size is not null and v_uniform_size not in ('S','M','L','XL','2XL','3XL') then raise exception 'Choose a listed uniform size.'; end if;
    if v_jersey_name is not null and char_length(v_jersey_name)>24 then raise exception 'Jersey name must be 24 characters or fewer.'; end if;
    if p_jersey_number is not null and exists(select 1 from public.registrations where team_id=p_team_id and jersey_number=p_jersey_number and id<>p_registration_id) then raise exception 'That jersey number is already used on this team.'; end if;
    update public.registrations set jersey_number=p_jersey_number,position=v_position,jersey_name=v_jersey_name where id=p_registration_id;
    update public.player_profiles set preferred_uniform_size=v_uniform_size where id=v_player_id;
  end if;
  insert into public.team_roster_drafts(team_id,status,updated_at) values(p_team_id,'editing',now()) on conflict(team_id) do update set status='editing',updated_at=now();
end;
$$;
grant execute on function public.captain_update_draft_player(uuid,uuid,integer,text,text,text,boolean) to authenticated;

drop function if exists public.captain_create_roster_request(uuid,text,text);
create function public.captain_create_roster_request(p_team_id uuid,p_request_type text,p_details text,p_registration_id uuid default null,p_target_team_id uuid default null,p_invitation_id uuid default null)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_season_id uuid;v_division_id uuid;v_setup_stage smallint;v_request_id uuid;v_details text:=nullif(trim(p_details),'');
begin
  select d.season_id,t.division_id,s.setup_stage into v_season_id,v_division_id,v_setup_stage from public.teams t join public.divisions d on d.id=t.division_id join public.seasons s on s.id=d.season_id where t.id=p_team_id;
  if v_season_id is null or not exists(select 1 from public.registrations r join public.player_profiles p on p.id=r.player_id where r.team_id=p_team_id and p.profile_id=(select auth.uid()) and r.role_label in ('Captain','Co-captain')) then raise exception 'Only this team''s captain or co-captain can submit roster requests.'; end if;
  if v_setup_stage < 5 then raise exception 'Roster requests open after the draft begins.'; end if;
  if p_request_type not in ('trade','add_player','remove_player','other') then raise exception 'Choose a valid request type.'; end if;
  if v_details is null or char_length(v_details)>1000 then raise exception 'Enter request details of 1 to 1,000 characters.'; end if;
  if p_request_type in ('trade','remove_player') and not exists(select 1 from public.registrations where id=p_registration_id and team_id=p_team_id and role_label='Player') then raise exception 'Choose a player from your team.'; end if;
  if p_request_type='trade' and not exists(select 1 from public.teams where id=p_target_team_id and division_id=v_division_id and id<>p_team_id) then raise exception 'Choose another team in this division.'; end if;
  if p_request_type='add_player' and not exists(select 1 from public.season_invitations where id=p_invitation_id and division_id=v_division_id and response='joining' and selection_status in ('eligible','waitlisted')) then raise exception 'Choose an eligible player from this division.'; end if;
  insert into public.roster_change_requests(season_id,team_id,requested_by,request_type,details,registration_id,target_team_id,invitation_id)
  values(v_season_id,p_team_id,(select auth.uid()),p_request_type,v_details,p_registration_id,p_target_team_id,p_invitation_id) returning id into v_request_id;
  return v_request_id;
end;
$$;
grant execute on function public.captain_create_roster_request(uuid,text,text,uuid,uuid,uuid) to authenticated;

create or replace function public.owner_return_player_to_draft_pool(p_registration_id uuid,p_reason text)
returns void language plpgsql security definer set search_path=''
as $$
declare v_conference_id uuid;v_division_id uuid;v_team_id uuid;v_reason text:=nullif(trim(p_reason),'');
begin
  select s.conference_id,r.division_id,r.team_id into v_conference_id,v_division_id,v_team_id from public.registrations r join public.seasons s on s.id=r.season_id where r.id=p_registration_id;
  if v_conference_id is null or not exists(select 1 from public.conference_memberships m where m.conference_id=v_conference_id and m.profile_id=(select auth.uid()) and m.role='owner') then raise exception 'Owner access is required.'; end if;
  if v_team_id is null or not exists(select 1 from public.registrations where id=p_registration_id and role_label='Player') then raise exception 'Only rostered players can return to the draft pool.'; end if;
  if v_reason is null or char_length(v_reason)>500 then raise exception 'Enter a reason of up to 500 characters.'; end if;
  update public.registrations set team_id=null,jersey_number=null,position=null,jersey_name=null,status='pending' where id=p_registration_id;
  update public.season_invitations set selection_status='eligible' where registration_id=p_registration_id and division_id=v_division_id;
  insert into public.team_roster_drafts(team_id,status,updated_at) values(v_team_id,'editing',now()) on conflict(team_id) do update set status='editing',updated_at=now();
end;
$$;
grant execute on function public.owner_return_player_to_draft_pool(uuid,text) to authenticated;

create or replace function public.owner_review_roster_change_request(p_request_id uuid,p_decision text,p_owner_note text default null)
returns void language plpgsql security definer set search_path=''
as $$
declare v_request public.roster_change_requests%rowtype;v_conference_id uuid;v_division_id uuid;v_note text:=nullif(trim(p_owner_note),'');
begin
  select r,s.conference_id,t.division_id into v_request,v_conference_id,v_division_id from public.roster_change_requests r join public.seasons s on s.id=r.season_id join public.teams t on t.id=r.team_id where r.id=p_request_id for update;
  if v_request.id is null or not exists(select 1 from public.conference_memberships m where m.conference_id=v_conference_id and m.profile_id=(select auth.uid()) and m.role='owner') then raise exception 'Owner access is required.'; end if;
  if v_request.status<>'pending' then raise exception 'This request has already been reviewed.'; end if;
  if p_decision not in ('approved','declined') then raise exception 'Choose Approve or Decline.'; end if;
  if p_decision='declined' and v_note is null then raise exception 'Add a note explaining the decline.'; end if;
  if p_decision='approved' then
    if v_request.request_type='remove_player' then
      update public.registrations set team_id=null,jersey_number=null,position=null,jersey_name=null,status='pending' where id=v_request.registration_id and team_id=v_request.team_id;
      update public.season_invitations set selection_status='eligible' where registration_id=v_request.registration_id and division_id=v_division_id;
    elsif v_request.request_type='trade' then
      update public.registrations set team_id=v_request.target_team_id,status='pending' where id=v_request.registration_id and team_id=v_request.team_id;
    elsif v_request.request_type='add_player' then
      update public.registrations set team_id=v_request.team_id,status='pending' where id=(select registration_id from public.season_invitations where id=v_request.invitation_id);
      update public.season_invitations set selection_status='waitlisted' where id=v_request.invitation_id;
    end if;
  end if;
  update public.roster_change_requests set status=p_decision,owner_note=v_note,resolved_at=now() where id=p_request_id;
end;
$$;
grant execute on function public.owner_review_roster_change_request(uuid,text,text) to authenticated;
