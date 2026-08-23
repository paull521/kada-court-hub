-- Lets a conference owner add an existing, claimed KCH profile to their own
-- conference directory. This is required before that player can be selected
-- as a captain or receive a division invitation.

create or replace function public.owner_add_conference_player(
  p_conference_id uuid,
  p_public_player_id text
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_player_id uuid;
begin
  if p_conference_id is null or not public.user_has_conference_role(p_conference_id,array['owner']::public.conference_role[]) then
    raise exception 'Only this conference owner can add players to its directory.';
  end if;

  select player.id into v_player_id
  from public.player_profiles player
  where upper(player.public_player_id)=upper(trim(p_public_player_id))
    and player.profile_id is not null;

  if v_player_id is null then
    raise exception 'No active KCH profile was found with that Player ID. Ask the player to complete account creation, then use the ID on their Profile page.';
  end if;

  insert into public.conference_player_pool(conference_id,player_id)
  values(p_conference_id,v_player_id)
  on conflict(conference_id,player_id) do nothing;

  insert into public.conference_memberships(conference_id,profile_id,role)
  select p_conference_id,player.profile_id,'player'::public.conference_role
  from public.player_profiles player
  where player.id=v_player_id
  on conflict(conference_id,profile_id,role) do nothing;

  insert into public.activity_log(conference_id,actor_profile_id,action,entity_type,entity_id,summary)
  values(p_conference_id,(select auth.uid()),'create','conference_player',v_player_id::text,'Added a KCH player to the conference directory');

  return v_player_id;
end;
$$;

revoke all on function public.owner_add_conference_player(uuid,text) from public;
grant execute on function public.owner_add_conference_player(uuid,text) to authenticated;
