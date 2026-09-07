-- The shared owner-application link creates or reconnects the applicant's
-- platform owner record before they acknowledge the free-demo overview.
-- This is intentionally repeated here because existing deployments can have
-- the owner tables without the original registration RPC.

create or replace function public.platform_register_owner_applicant()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles%rowtype;
  v_email text;
  v_owner_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in to your KCH account first.';
  end if;

  select * into v_profile
  from public.profiles
  where id = (select auth.uid());

  v_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  if v_profile.id is null or v_email = '' then
    raise exception 'Your KCH profile could not be found.';
  end if;

  select id into v_owner_id
  from public.platform_owner_records
  where profile_id = (select auth.uid()) or lower(email) = v_email
  limit 1;

  if v_owner_id is null then
    insert into public.platform_owner_records(full_name, email, phone, profile_id, status)
    values (v_profile.display_name, v_email, coalesce(v_profile.mobile, ''), (select auth.uid()), 'invited')
    returning id into v_owner_id;
  else
    update public.platform_owner_records
    set full_name = v_profile.display_name,
        email = v_email,
        phone = coalesce(v_profile.mobile, ''),
        profile_id = (select auth.uid()),
        updated_at = now()
    where id = v_owner_id;
  end if;

  return v_owner_id;
end;
$$;

revoke all on function public.platform_register_owner_applicant() from public;
grant execute on function public.platform_register_owner_applicant() to authenticated;
