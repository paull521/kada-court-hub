-- New KCH player profiles must originate from a valid conference invitation.
-- Platform-owner accounts remain available only through their individual owner invitation.

revoke execute on function public.prepare_division_join_from_link(uuid) from authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_display_name text;
  v_conference_id uuid;
  v_player_id uuid;
  v_player_token uuid;
  v_owner_token uuid;
begin
  v_display_name := coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1));

  begin
    v_player_token := nullif(new.raw_user_meta_data ->> 'conference_invitation_token', '')::uuid;
  exception when invalid_text_representation then
    raise exception 'KCH profiles can only be created from a valid invitation.';
  end;

  begin
    v_owner_token := nullif(new.raw_user_meta_data ->> 'platform_owner_invitation_token', '')::uuid;
  exception when invalid_text_representation then
    raise exception 'KCH profiles can only be created from a valid invitation.';
  end;

  if v_player_token is null and v_owner_token is null then
    raise exception 'KCH profiles can only be created from a valid invitation.';
  end if;

  if v_player_token is not null then
    select invitation.conference_id into v_conference_id
    from public.conference_player_invitation_links invitation
    where invitation.token = v_player_token;
    if v_conference_id is null then
      raise exception 'This conference invitation is not available.';
    end if;
  else
    if not exists(
      select 1 from public.platform_owner_invitations invitation
      where invitation.token = v_owner_token
        and invitation.accepted_at is null
        and invitation.expires_at >= now()
    ) then
      raise exception 'This owner invitation is not available.';
    end if;
  end if;

  insert into public.profiles (id, display_name)
  values (new.id, v_display_name);

  insert into public.player_profiles (profile_id, public_player_id, display_name, email, claimed_at)
  values (new.id, 'KCH-' || upper(substr(replace(new.id::text, '-', ''), 1, 8)), v_display_name, new.email, now())
  returning id into v_player_id;

  if v_conference_id is not null then
    insert into public.conference_player_pool(conference_id, player_id)
    values (v_conference_id, v_player_id)
    on conflict(conference_id, player_id) do nothing;

    insert into public.conference_memberships(conference_id, profile_id, role)
    values (v_conference_id, new.id, 'player'::public.conference_role)
    on conflict(conference_id, profile_id, role) do nothing;
  end if;

  return new;
end;
$$;
