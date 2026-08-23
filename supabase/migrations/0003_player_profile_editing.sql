grant update (preferred_uniform_size) on public.player_profiles to authenticated;

create policy "Users update own player preferences" on public.player_profiles for update to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

create or replace function public.update_own_player_profile(
  p_mobile text,
  p_birthdate date,
  p_location text,
  p_uniform_size text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.profiles
  set mobile = nullif(trim(p_mobile), ''),
      birthdate = p_birthdate,
      location = nullif(trim(p_location), '')
  where id = (select auth.uid());

  update public.player_profiles
  set preferred_uniform_size = nullif(trim(p_uniform_size), '')
  where profile_id = (select auth.uid());
end;
$$;

grant execute on function public.update_own_player_profile(text,date,text,text) to authenticated;

