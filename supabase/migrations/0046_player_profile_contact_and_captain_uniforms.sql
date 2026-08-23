-- Players maintain their personal contact information. Captains maintain
-- roster-specific details, including uniform size, while a draft is editable.

drop function if exists public.update_own_player_profile(text,date,text,text);
create function public.update_own_player_profile(
  p_mobile text,
  p_email text,
  p_birthdate date,
  p_location text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if nullif(trim(p_email),'') is null or char_length(trim(p_email)) > 254 or trim(p_email) !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Enter a valid email address.';
  end if;

  update public.profiles
  set mobile = nullif(trim(p_mobile), ''),
      birthdate = p_birthdate,
      location = nullif(trim(p_location), '')
  where id = (select auth.uid());

  update public.player_profiles
  set email = lower(trim(p_email))
  where profile_id = (select auth.uid());
end;
$$;
grant execute on function public.update_own_player_profile(text,text,date,text) to authenticated;

create or replace function public.captain_save_draft_player(
  p_team_id uuid,
  p_invitation_id uuid,
  p_jersey_number integer default null,
  p_position text default null,
  p_uniform_size text default null
)
returns void language plpgsql security definer set search_path=''
as $$
declare v_division_id uuid;v_registration_id uuid;v_player_id uuid;v_status text;v_position text:=nullif(trim(p_position),'');v_uniform_size text:=nullif(upper(trim(p_uniform_size)), '');
begin
  select team.division_id into v_division_id from public.teams team where team.id=p_team_id;
  if v_division_id is null or not exists(select 1 from public.registrations registration join public.player_profiles player on player.id=registration.player_id where registration.team_id=p_team_id and player.profile_id=(select auth.uid()) and registration.role_label in ('Captain','Co-captain')) then raise exception 'Captain access is required for this team.'; end if;
  select coalesce(draft.status,'editing') into v_status from public.teams team left join public.team_roster_drafts draft on draft.team_id=team.id where team.id=p_team_id;
  if v_status in ('submitted','approved') then raise exception 'This roster is locked while it is under owner review.'; end if;
  select invitation.registration_id,invitation.player_id into v_registration_id,v_player_id from public.season_invitations invitation where invitation.id=p_invitation_id and invitation.division_id=v_division_id and invitation.response='joining' and invitation.selection_status in ('eligible','waitlisted');
  if v_registration_id is null then raise exception 'Choose a player from this division draft list.'; end if;
  if p_jersey_number is not null and (p_jersey_number<0 or p_jersey_number>99) then raise exception 'Jersey number must be from 0 to 99.'; end if;
  if v_position is not null and char_length(v_position)>40 then raise exception 'Enter a shorter position.'; end if;
  if v_uniform_size is not null and v_uniform_size not in ('S','M','L','XL','2XL','3XL') then raise exception 'Choose a listed uniform size.'; end if;
  if p_jersey_number is not null and exists(select 1 from public.registrations where team_id=p_team_id and jersey_number=p_jersey_number and id<>v_registration_id) then raise exception 'That jersey number is already used on this team.'; end if;
  update public.registrations set team_id=p_team_id,jersey_number=p_jersey_number,position=v_position,status='pending' where id=v_registration_id;
  update public.player_profiles set preferred_uniform_size=v_uniform_size where id=v_player_id;
  insert into public.team_roster_drafts(team_id,status,updated_at) values(p_team_id,'editing',now()) on conflict(team_id) do update set status='editing',submitted_at=null,submitted_by=null,reviewed_at=null,reviewed_by=null,owner_note=null,updated_at=now();
end;
$$;
grant execute on function public.captain_save_draft_player(uuid,uuid,integer,text,text) to authenticated;

create or replace function public.captain_update_draft_player(
  p_team_id uuid,
  p_registration_id uuid,
  p_jersey_number integer default null,
  p_position text default null,
  p_uniform_size text default null,
  p_remove boolean default false
)
returns void language plpgsql security definer set search_path=''
as $$
declare v_status text;v_player_id uuid;v_position text:=nullif(trim(p_position),'');v_uniform_size text:=nullif(upper(trim(p_uniform_size)), '');
begin
  if not exists(select 1 from public.registrations registration join public.player_profiles player on player.id=registration.player_id where registration.team_id=p_team_id and player.profile_id=(select auth.uid()) and registration.role_label in ('Captain','Co-captain')) then raise exception 'Captain access is required for this team.'; end if;
  select coalesce(draft.status,'editing') into v_status from public.teams team left join public.team_roster_drafts draft on draft.team_id=team.id where team.id=p_team_id;
  if v_status in ('submitted','approved') then raise exception 'This roster is locked while it is under owner review.'; end if;
  select player_id into v_player_id from public.registrations where id=p_registration_id and team_id=p_team_id and role_label='Player';
  if v_player_id is null then raise exception 'Choose a drafted player on your team.'; end if;
  if p_remove then update public.registrations set team_id=null,jersey_number=null,position=null where id=p_registration_id;
  else
    if p_jersey_number is not null and (p_jersey_number<0 or p_jersey_number>99) then raise exception 'Jersey number must be from 0 to 99.'; end if;
    if v_position is not null and char_length(v_position)>40 then raise exception 'Enter a shorter position.'; end if;
    if v_uniform_size is not null and v_uniform_size not in ('S','M','L','XL','2XL','3XL') then raise exception 'Choose a listed uniform size.'; end if;
    if p_jersey_number is not null and exists(select 1 from public.registrations where team_id=p_team_id and jersey_number=p_jersey_number and id<>p_registration_id) then raise exception 'That jersey number is already used on this team.'; end if;
    update public.registrations set jersey_number=p_jersey_number,position=v_position where id=p_registration_id;
    update public.player_profiles set preferred_uniform_size=v_uniform_size where id=v_player_id;
  end if;
  insert into public.team_roster_drafts(team_id,status,updated_at) values(p_team_id,'editing',now()) on conflict(team_id) do update set status='editing',updated_at=now();
end;
$$;
grant execute on function public.captain_update_draft_player(uuid,uuid,integer,text,text,boolean) to authenticated;
