-- Two-stage division roster release: review copy, then final roster.

create or replace function public.owner_set_division_roster_review_deadline(p_division_id uuid,p_review_deadline date)
returns void language plpgsql security definer set search_path=''
as $$
declare v_conference_id uuid;v_season_name text;v_division_name text;v_broadcast_id uuid;
begin
  select season.conference_id,season.name,division.name into v_conference_id,v_season_name,v_division_name
  from public.divisions division join public.seasons season on season.id=division.season_id where division.id=p_division_id;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then raise exception 'Only the conference owner can set the roster review deadline.'; end if;
  if p_review_deadline<current_date then raise exception 'The review deadline cannot be in the past.'; end if;
  if exists(select 1 from public.season_broadcasts where division_id=p_division_id and broadcast_type='roster_final') then raise exception 'The final roster has already been published.'; end if;
  select id into v_broadcast_id from public.season_broadcasts where division_id=p_division_id and broadcast_type='roster_draft' order by created_at desc limit 1;
  if v_broadcast_id is null then raise exception 'Share the review roster before setting its deadline.'; end if;

  update public.season_broadcasts set response_deadline=p_review_deadline where id=v_broadcast_id;
  insert into public.notifications(profile_id,notification_type,title,body,link_path,entity_id)
  select distinct player.profile_id,'roster_review_deadline',v_season_name||' · '||v_division_name||' roster review',
    'Please review your team roster. Changes are welcome through '||to_char(p_review_deadline,'Mon FMDD, YYYY')||'. Contact your captain or conference owner outside KCH if an update is needed.',
    '/my-team',v_broadcast_id
  from public.registrations registration join public.player_profiles player on player.id=registration.player_id
  where registration.division_id=p_division_id and registration.team_id is not null and registration.status='active' and player.profile_id is not null
  on conflict(profile_id,notification_type,entity_id) do update set title=excluded.title,body=excluded.body,link_path=excluded.link_path,read_at=null,created_at=now();
end;
$$;

create or replace function public.owner_publish_division_final_roster(p_division_id uuid,p_message text)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_conference_id uuid;v_season_id uuid;v_season_name text;v_division_name text;v_deadline date;v_message text:=nullif(trim(p_message),'');v_broadcast_id uuid;
begin
  select season.conference_id,season.id,season.name,division.name into v_conference_id,v_season_id,v_season_name,v_division_name
  from public.divisions division join public.seasons season on season.id=division.season_id where division.id=p_division_id;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then raise exception 'Only the conference owner can publish the final roster.'; end if;
  if v_message is null or char_length(v_message)>1000 then raise exception 'Enter a final roster message of 1 to 1000 characters.'; end if;
  if exists(select 1 from public.season_broadcasts where division_id=p_division_id and broadcast_type='roster_final') then raise exception 'This division final roster has already been published.'; end if;
  select response_deadline into v_deadline from public.season_broadcasts where division_id=p_division_id and broadcast_type='roster_draft' order by created_at desc limit 1;
  if v_deadline is null then raise exception 'Set the roster review deadline first.'; end if;
  if current_date<v_deadline then raise exception 'The roster review period is still open.'; end if;
  if exists(select 1 from public.teams team left join public.team_roster_drafts draft on draft.team_id=team.id where team.division_id=p_division_id and team.active and coalesce(draft.status,'editing')<>'approved') then raise exception 'Every updated team roster must be approved before final publication.'; end if;

  insert into public.season_broadcasts(season_id,division_id,message,created_by,broadcast_type)
  values(v_season_id,p_division_id,v_message,(select auth.uid()),'roster_final') returning id into v_broadcast_id;
  insert into public.notifications(profile_id,notification_type,title,body,link_path,entity_id)
  select distinct player.profile_id,'roster_final_published',v_season_name||' · '||v_division_name||' final roster',v_message,'/my-team',v_broadcast_id
  from public.registrations registration join public.player_profiles player on player.id=registration.player_id
  where registration.division_id=p_division_id and registration.team_id is not null and registration.status='active' and player.profile_id is not null;
  insert into public.activity_log(conference_id,actor_profile_id,action,entity_type,entity_id,summary)
  values(v_conference_id,(select auth.uid()),'publish','division_final_roster',p_division_id::text,'Published the final roster for '||v_division_name);
  return v_broadcast_id;
end;
$$;

revoke all on function public.owner_set_division_roster_review_deadline(uuid,date) from public;
revoke all on function public.owner_publish_division_final_roster(uuid,text) from public;
grant execute on function public.owner_set_division_roster_review_deadline(uuid,date) to authenticated;
grant execute on function public.owner_publish_division_final_roster(uuid,text) to authenticated;

create or replace function public.get_published_division_roster(p_division_id uuid)
returns table(registration_id uuid,team_id uuid,team_name text,player_id uuid,player_name text,jersey_number integer,player_position text,role_label text)
language plpgsql stable security definer set search_path=''
as $$
begin
  if not exists(
    select 1 from public.registrations registration
    join public.player_profiles player on player.id=registration.player_id
    where registration.division_id=p_division_id and registration.status='active' and player.profile_id=(select auth.uid())
  ) then raise exception 'Only a rostered player can view this division roster.'; end if;
  if not exists(select 1 from public.season_broadcasts where division_id=p_division_id and broadcast_type in ('roster_draft','roster_final')) then raise exception 'This division roster has not been shared.'; end if;

  return query
  select registration.id,team.id,team.name,player.id,coalesce(player.display_name,'Unnamed Player'),registration.jersey_number::integer,coalesce(registration.position,''),registration.role_label
  from public.registrations registration
  join public.teams team on team.id=registration.team_id
  join public.player_profiles player on player.id=registration.player_id
  where registration.division_id=p_division_id and registration.status='active' and team.active
  order by team.name,registration.jersey_number nulls last,player.display_name;
end;
$$;

revoke all on function public.get_published_division_roster(uuid) from public;
grant execute on function public.get_published_division_roster(uuid) to authenticated;
