-- Division-by-division player invitations with separate flyers and deadlines.

alter table public.season_broadcasts add column if not exists division_id uuid references public.divisions(id) on delete cascade;
alter table public.season_invitations add column if not exists division_id uuid references public.divisions(id) on delete cascade;
alter table public.season_invitations drop constraint if exists season_invitations_season_id_player_id_key;
alter table public.season_invitations drop constraint if exists season_invitations_season_division_player_key;
alter table public.season_invitations add constraint season_invitations_season_division_player_key unique(season_id,division_id,player_id);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('invitation-flyers','invitation-flyers',true,8388608,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "Owners upload division invitation flyers" on storage.objects;
create policy "Owners upload division invitation flyers" on storage.objects for insert to authenticated
with check(bucket_id='invitation-flyers' and exists(
  select 1 from public.divisions division join public.seasons season on season.id=division.season_id
  where division.id=((storage.foldername(storage.objects.name))[1])::uuid
    and public.user_has_conference_role(season.conference_id,array['owner']::public.conference_role[])
));
drop policy if exists "Owners delete division invitation flyers" on storage.objects;
create policy "Owners delete division invitation flyers" on storage.objects for delete to authenticated
using(bucket_id='invitation-flyers' and exists(
  select 1 from public.divisions division join public.seasons season on season.id=division.season_id
  where division.id=((storage.foldername(storage.objects.name))[1])::uuid
    and public.user_has_conference_role(season.conference_id,array['owner']::public.conference_role[])
));

create or replace function public.owner_invite_division_players(
  p_division_id uuid,
  p_message text,
  p_response_deadline date,
  p_players_per_team integer,
  p_flyer_path text default null
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_conference_id uuid;
  v_season_id uuid;
  v_season_name text;
  v_division_name text;
  v_stage smallint;
  v_message text:=nullif(trim(p_message),'');
  v_broadcast_id uuid;
  v_invited_count integer;
  v_team_count integer;
begin
  select season.conference_id,season.id,season.name,season.setup_stage,division.name
  into v_conference_id,v_season_id,v_season_name,v_stage,v_division_name
  from public.divisions division join public.seasons season on season.id=division.season_id
  where division.id=p_division_id for update of season;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then
    raise exception 'Only this conference owner can invite players.';
  end if;
  if v_stage not in (4,5) then raise exception 'Complete fees and uniforms before inviting players.'; end if;
  if v_message is null or char_length(v_message)>1000 then raise exception 'Enter an invitation message of 1 to 1000 characters.'; end if;
  if p_response_deadline<current_date then raise exception 'The response deadline cannot be in the past.'; end if;
  if p_players_per_team<1 or p_players_per_team>30 then raise exception 'Players per team must be from 1 to 30.'; end if;
  select count(*) into v_team_count from public.teams team where team.division_id=p_division_id and team.active;
  if v_team_count<1 then raise exception 'Add teams to this division before inviting players.'; end if;

  insert into public.season_broadcasts(season_id,division_id,message,created_by,broadcast_type,response_deadline,flyer_path,team_count,players_per_team)
  values(v_season_id,p_division_id,v_message,(select auth.uid()),'player_invitation',p_response_deadline,nullif(p_flyer_path,''),v_team_count,p_players_per_team)
  returning id into v_broadcast_id;

  insert into public.season_invitations(broadcast_id,season_id,division_id,player_id,registration_id,response,responded_at)
  select v_broadcast_id,v_season_id,p_division_id,pool.player_id,null,'pending',null
  from public.conference_player_pool pool
  where pool.conference_id=v_conference_id
    and not exists(select 1 from public.registrations registration where registration.season_id=v_season_id and registration.player_id=pool.player_id and registration.team_id is not null)
  on conflict(season_id,division_id,player_id) do update
    set broadcast_id=excluded.broadcast_id,response='pending',responded_at=null,created_at=now();

  select count(*) into v_invited_count from public.season_invitations invitation where invitation.broadcast_id=v_broadcast_id;
  update public.season_broadcasts set invited_count=v_invited_count where id=v_broadcast_id;
  update public.seasons set players_per_team=p_players_per_team,
    setup_stage=case when not exists(
      select 1 from public.divisions required_division
      where required_division.season_id=v_season_id and not exists(
        select 1 from public.season_broadcasts broadcast
        where broadcast.division_id=required_division.id and broadcast.broadcast_type='player_invitation'
      )
    ) then 5 else setup_stage end
  where id=v_season_id;

  insert into public.notifications(profile_id,notification_type,title,body,link_path,entity_id)
  select player.profile_id,'season_invitation',v_season_name||' · '||v_division_name,v_message,'/home',invitation.id
  from public.season_invitations invitation join public.player_profiles player on player.id=invitation.player_id
  where invitation.broadcast_id=v_broadcast_id and player.profile_id is not null
  on conflict(profile_id,notification_type,entity_id) do update
    set title=excluded.title,body=excluded.body,link_path=excluded.link_path,read_at=null,created_at=now();
  return v_broadcast_id;
end;
$$;

create or replace function public.respond_to_season_invitation(p_invitation_id uuid,p_response text)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_registration_id uuid;
  v_profile_id uuid;
  v_player_id uuid;
  v_season_id uuid;
begin
  if p_response not in ('joining','not_joining') then raise exception 'Choose Joining or Not Joining.'; end if;
  select invitation.registration_id,invitation.player_id,invitation.season_id,player.profile_id
  into v_registration_id,v_player_id,v_season_id,v_profile_id
  from public.season_invitations invitation join public.player_profiles player on player.id=invitation.player_id
  where invitation.id=p_invitation_id;
  if v_profile_id is null or v_profile_id<>(select auth.uid()) then raise exception 'This invitation does not belong to the signed-in player.'; end if;
  if exists(select 1 from public.season_invitations invitation join public.season_broadcasts broadcast on broadcast.id=invitation.broadcast_id where invitation.id=p_invitation_id and broadcast.response_deadline<current_date) then raise exception 'The response deadline has passed.'; end if;
  if p_response='joining' and exists(select 1 from public.season_invitations other where other.season_id=v_season_id and other.player_id=v_player_id and other.id<>p_invitation_id and other.response='joining') then raise exception 'You are already joining another division in this season.'; end if;
  if p_response='joining' then
    insert into public.registrations(player_id,season_id,team_id,status,role_label)
    values(v_player_id,v_season_id,null,'pending','Player')
    on conflict(player_id,season_id) do update set status='pending'
    returning id into v_registration_id;
  elsif v_registration_id is not null then
    update public.registrations set status='inactive' where id=v_registration_id and team_id is null;
  end if;
  update public.season_invitations set response=p_response,responded_at=now(),registration_id=v_registration_id where id=p_invitation_id;
  update public.notifications set read_at=now() where profile_id=(select auth.uid()) and notification_type='season_invitation' and entity_id=p_invitation_id;
end;
$$;

create or replace function public.owner_assign_draft_player(
  p_invitation_id uuid,
  p_team_id uuid,
  p_jersey_number integer default null,
  p_position text default null
)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_conference_id uuid;
  v_season_id uuid;
  v_division_id uuid;
  v_registration_id uuid;
  v_position text:=nullif(trim(p_position),'');
begin
  select invitation.season_id,invitation.division_id,invitation.registration_id,season.conference_id
  into v_season_id,v_division_id,v_registration_id,v_conference_id
  from public.season_invitations invitation join public.seasons season on season.id=invitation.season_id
  where invitation.id=p_invitation_id and invitation.response='joining';
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then raise exception 'Only a conference owner can draft players.'; end if;
  if not exists(
    select 1 from public.teams team join public.divisions division on division.id=team.division_id
    where team.id=p_team_id and division.season_id=v_season_id and (v_division_id is null or division.id=v_division_id)
  ) then raise exception 'Choose a team in the division that sent this invitation.'; end if;
  if p_jersey_number is not null and (p_jersey_number<0 or p_jersey_number>99) then raise exception 'Jersey number must be from 0 to 99.'; end if;
  if v_position is not null and char_length(v_position)>40 then raise exception 'Enter a shorter position.'; end if;
  if p_jersey_number is not null and exists(select 1 from public.registrations where team_id=p_team_id and jersey_number=p_jersey_number and id<>v_registration_id) then raise exception 'That jersey number is already assigned on this team.'; end if;
  update public.registrations set team_id=p_team_id,jersey_number=p_jersey_number,position=v_position,status='pending' where id=v_registration_id;
end;
$$;

revoke all on function public.owner_invite_division_players(uuid,text,date,integer,text) from public;
grant execute on function public.owner_invite_division_players(uuid,text,date,integer,text) to authenticated;
revoke all on function public.owner_assign_draft_player(uuid,uuid,integer,text) from public;
grant execute on function public.owner_assign_draft_player(uuid,uuid,integer,text) to authenticated;
revoke all on function public.respond_to_season_invitation(uuid,text) from public;
grant execute on function public.respond_to_season_invitation(uuid,text) to authenticated;
