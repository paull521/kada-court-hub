-- Captains and co-captains may update their own team-specific player details.
create or replace function public.captain_update_player_details(
  p_team_id uuid,
  p_registration_id uuid,
  p_jersey_number integer default null,
  p_position text default null,
  p_uniform_size text default null,
  p_jersey_name text default null
)
returns void language plpgsql security definer set search_path=''
as $$
declare v_player_id uuid;v_position text:=nullif(trim(p_position),'');v_uniform_size text:=nullif(upper(trim(p_uniform_size)), '');v_jersey_name text:=nullif(trim(p_jersey_name),'');
begin
  if not exists(select 1 from public.registrations r join public.player_profiles p on p.id=r.player_id where r.team_id=p_team_id and p.profile_id=(select auth.uid()) and r.role_label in ('Captain','Co-captain')) then raise exception 'Captain access is required for this team.'; end if;
  select player_id into v_player_id from public.registrations where id=p_registration_id and team_id=p_team_id and role_label in ('Player','Captain','Co-captain');
  if v_player_id is null then raise exception 'Choose a player on your team.'; end if;
  if p_jersey_number is not null and (p_jersey_number<0 or p_jersey_number>99) then raise exception 'Jersey number must be from 0 to 99.'; end if;
  if v_position is not null and v_position not in ('G','SG','PG','F','PF','C') then raise exception 'Choose G, SG, PG, F, PF, or C.'; end if;
  if v_uniform_size is not null and v_uniform_size not in ('S','M','L','XL','2XL','3XL') then raise exception 'Choose a listed uniform size.'; end if;
  if v_jersey_name is not null and char_length(v_jersey_name)>24 then raise exception 'Jersey name must be 24 characters or fewer.'; end if;
  if p_jersey_number is not null and exists(select 1 from public.registrations where team_id=p_team_id and jersey_number=p_jersey_number and id<>p_registration_id) then raise exception 'That jersey number is already used on this team.'; end if;
  update public.registrations set jersey_number=p_jersey_number,position=v_position,jersey_name=v_jersey_name where id=p_registration_id;
  update public.player_profiles set preferred_uniform_size=v_uniform_size where id=v_player_id;
end;
$$;
grant execute on function public.captain_update_player_details(uuid,uuid,integer,text,text,text) to authenticated;
