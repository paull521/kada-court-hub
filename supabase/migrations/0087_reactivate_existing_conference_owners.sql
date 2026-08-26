-- Existing KCH owner/conference records predate the invitation contract flow.
-- They can be restored after suspension; only invited owner records require a
-- completed contract before Platform Creator activates them.
create or replace function public.platform_set_owner_status(p_owner_id uuid,p_status text)
returns void language plpgsql security definer set search_path='' as $$
declare r public.platform_owner_records%rowtype; v_is_invited_owner boolean;
begin
  if not public.is_platform_creator() then raise exception 'Platform Creator access is required.'; end if;
  if p_status not in('active','suspended','inactive') then raise exception 'Choose Active, Suspended, or Inactive.'; end if;
  select * into r from public.platform_owner_records where id=p_owner_id for update;
  if r.id is null then raise exception 'Owner was not found.'; end if;

  if p_status='active' then
    if r.profile_id is null or r.conference_id is null then
      raise exception 'The owner must complete KCH login first.';
    end if;
    select exists(
      select 1 from public.platform_owner_invitations invitation
      where invitation.owner_record_id=r.id
    ) into v_is_invited_owner;
    if v_is_invited_owner and not exists(
      select 1 from public.platform_owner_contract_acknowledgments acknowledgment
      where acknowledgment.owner_record_id=r.id
    ) then
      raise exception 'The owner must accept the invitation and sign the contract first.';
    end if;
    insert into public.conference_memberships(conference_id,profile_id,role)
    values(r.conference_id,r.profile_id,'owner') on conflict do nothing;
  else
    delete from public.conference_memberships
    where conference_id=r.conference_id and profile_id=r.profile_id and role='owner';
  end if;

  update public.platform_owner_records set status=p_status,updated_at=now() where id=r.id;
end;$$;

revoke all on function public.platform_set_owner_status(uuid,text) from public;
grant execute on function public.platform_set_owner_status(uuid,text) to authenticated;
