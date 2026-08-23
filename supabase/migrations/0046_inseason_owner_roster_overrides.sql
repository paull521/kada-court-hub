-- Owner-only roster controls after setup. Changes are audited and never delete history.
create or replace function public.owner_override_inseason_registration(p_registration_id uuid,p_team_id uuid,p_status text,p_jersey_number integer default null,p_position text default null,p_reason text default null)
returns void language plpgsql security definer set search_path='' as $$
declare v_conference_id uuid;v_division_id uuid;v_player_name text;v_team_name text;v_reason text:=nullif(trim(p_reason),'');v_position text:=nullif(trim(p_position),'');
begin
  select season.conference_id,division.id,player.display_name into v_conference_id,v_division_id,v_player_name
  from public.registrations registration join public.player_profiles player on player.id=registration.player_id join public.teams old_team on old_team.id=registration.team_id join public.divisions division on division.id=old_team.division_id join public.seasons season on season.id=division.season_id where registration.id=p_registration_id;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then raise exception 'Only this conference owner can make roster overrides.'; end if;
  select name into v_team_name from public.teams where id=p_team_id and division_id=v_division_id;
  if v_team_name is null then raise exception 'Choose a team in the same division.'; end if;
  if p_status not in('active','inactive') then raise exception 'Choose Active or Inactive.'; end if;
  if v_reason is null or char_length(v_reason)<3 or char_length(v_reason)>500 then raise exception 'Enter a short reason for this override.'; end if;
  if p_jersey_number is not null and (p_jersey_number<0 or p_jersey_number>99) then raise exception 'Jersey number must be from 0 to 99.'; end if;
  if v_position is not null and char_length(v_position)>40 then raise exception 'Enter a shorter position.'; end if;
  if p_jersey_number is not null and exists(select 1 from public.registrations where team_id=p_team_id and jersey_number=p_jersey_number and id<>p_registration_id) then raise exception 'That jersey number is already assigned on this team.'; end if;
  update public.registrations set team_id=p_team_id,status=p_status::public.registration_status,jersey_number=p_jersey_number,position=v_position where id=p_registration_id;
  insert into public.activity_log(conference_id,actor_profile_id,action,entity_type,entity_id,summary) values(v_conference_id,(select auth.uid()),'owner_override','inseason_roster',p_registration_id::text,'Owner changed '||coalesce(v_player_name,'a player')||' to '||v_team_name||': '||v_reason);
end;
$$;

create or replace function public.owner_add_inseason_player(p_team_id uuid,p_public_player_id text,p_jersey_number integer default null,p_position text default null,p_reason text default null)
returns void language plpgsql security definer set search_path='' as $$
declare v_conference_id uuid;v_season_id uuid;v_division_id uuid;v_player_id uuid;v_registration_id uuid;v_player_name text;v_reason text:=nullif(trim(p_reason),'');v_position text:=nullif(trim(p_position),'');
begin
  select season.conference_id,season.id,division.id into v_conference_id,v_season_id,v_division_id from public.teams team join public.divisions division on division.id=team.division_id join public.seasons season on season.id=division.season_id where team.id=p_team_id;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then raise exception 'Only this conference owner can add an in-season player.'; end if;
  select player.id,player.display_name into v_player_id,v_player_name from public.player_profiles player join public.conference_player_pool pool on pool.player_id=player.id where pool.conference_id=v_conference_id and upper(player.public_player_id)=upper(trim(p_public_player_id));
  if v_player_id is null then raise exception 'This KCH player is not in the conference directory.'; end if;
  if v_reason is null or char_length(v_reason)<3 or char_length(v_reason)>500 then raise exception 'Enter a short reason for this override.'; end if;
  if p_jersey_number is not null and (p_jersey_number<0 or p_jersey_number>99) then raise exception 'Jersey number must be from 0 to 99.'; end if;
  if v_position is not null and char_length(v_position)>40 then raise exception 'Enter a shorter position.'; end if;
  if p_jersey_number is not null and exists(select 1 from public.registrations where team_id=p_team_id and jersey_number=p_jersey_number and player_id<>v_player_id) then raise exception 'That jersey number is already assigned on this team.'; end if;
  insert into public.registrations(player_id,season_id,division_id,team_id,status,role_label,jersey_number,position)
  values(v_player_id,v_season_id,v_division_id,p_team_id,'active','Player',p_jersey_number,v_position)
  on conflict(player_id,season_id,division_id) where division_id is not null do update set team_id=excluded.team_id,status='active',jersey_number=excluded.jersey_number,position=excluded.position returning id into v_registration_id;
  insert into public.fees(registration_id,category,description,amount_cents,status,due_on)
  select v_registration_id,'league',division.name||' League Fee',financial.league_fee_cents,'due',season.starts_on from public.divisions division join public.seasons season on season.id=division.season_id join public.division_financial_settings financial on financial.division_id=division.id where division.id=v_division_id and financial.league_fee_enabled and not exists(select 1 from public.fees fee where fee.registration_id=v_registration_id and fee.category='league');
  insert into public.fees(registration_id,category,description,amount_cents,status,due_on)
  select v_registration_id,'uniform',division.name||' Uniform Fee',financial.uniform_fee_cents,'due',season.starts_on from public.divisions division join public.seasons season on season.id=division.season_id join public.division_financial_settings financial on financial.division_id=division.id where division.id=v_division_id and financial.uniform_fee_enabled and not exists(select 1 from public.fees fee where fee.registration_id=v_registration_id and fee.category='uniform');
  insert into public.fees(registration_id,category,description,amount_cents,status,due_on)
  select v_registration_id,'platform',division.name||' Platform Fee',financial.platform_fee_cents,'due',season.starts_on from public.divisions division join public.seasons season on season.id=division.season_id join public.division_financial_settings financial on financial.division_id=division.id where division.id=v_division_id and not exists(select 1 from public.fees fee where fee.registration_id=v_registration_id and fee.category='platform');
  insert into public.activity_log(conference_id,actor_profile_id,action,entity_type,entity_id,summary) values(v_conference_id,(select auth.uid()),'owner_override','inseason_roster',v_player_id::text,'Owner added or moved '||coalesce(v_player_name,'a player')||': '||v_reason);
end;
$$;
revoke all on function public.owner_override_inseason_registration(uuid,uuid,text,integer,text,text) from public;
grant execute on function public.owner_override_inseason_registration(uuid,uuid,text,integer,text,text) to authenticated;
revoke all on function public.owner_add_inseason_player(uuid,text,integer,text,text) from public;
grant execute on function public.owner_add_inseason_player(uuid,text,integer,text,text) to authenticated;

create or replace function public.owner_copy_division_uniforms(p_target_division_id uuid,p_source_division_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_conference_id uuid;v_source_conference_id uuid;v_dark text;v_light text;
begin
  select season.conference_id into v_conference_id from public.divisions division join public.seasons season on season.id=division.season_id where division.id=p_target_division_id;
  select season.conference_id,uniforms.dark_image_path,uniforms.light_image_path into v_source_conference_id,v_dark,v_light from public.divisions division join public.seasons season on season.id=division.season_id left join public.division_uniform_settings uniforms on uniforms.division_id=division.id where division.id=p_source_division_id;
  if v_conference_id is null or v_source_conference_id<>v_conference_id or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then raise exception 'Choose a prior division in this conference.'; end if;
  if v_dark is null and v_light is null then raise exception 'That prior division has no uniform photos to reuse.'; end if;
  insert into public.division_uniform_settings(division_id,dark_image_path,light_image_path,updated_by) values(p_target_division_id,v_dark,v_light,(select auth.uid())) on conflict(division_id) do update set dark_image_path=coalesce(excluded.dark_image_path,division_uniform_settings.dark_image_path),light_image_path=coalesce(excluded.light_image_path,division_uniform_settings.light_image_path),updated_by=(select auth.uid()),updated_at=now();
  insert into public.activity_log(conference_id,actor_profile_id,action,entity_type,entity_id,summary) values(v_conference_id,(select auth.uid()),'copy','division_uniforms',p_target_division_id::text,'Reused uniform photos from a prior division');
end;
$$;
revoke all on function public.owner_copy_division_uniforms(uuid,uuid) from public;
grant execute on function public.owner_copy_division_uniforms(uuid,uuid) to authenticated;
