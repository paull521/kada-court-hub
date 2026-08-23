-- Let conference owners search only the player identities in their own directory.

drop policy if exists "Owners view conference player directory" on public.player_profiles;
create policy "Owners view conference player directory"
on public.player_profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.conference_player_pool pool
    where pool.player_id=player_profiles.id
      and public.user_has_conference_role(
        pool.conference_id,
        array['owner']::public.conference_role[]
      )
  )
);
