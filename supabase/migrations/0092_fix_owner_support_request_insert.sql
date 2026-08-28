-- Store the signed-in owner with each support request.
create or replace function public.owner_request_platform_support(p_conference_id uuid,p_subject text,p_message text)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not public.user_has_conference_role(p_conference_id,array['owner']::public.conference_role[]) then
    raise exception 'Owner access is required.';
  end if;

  insert into public.platform_support_requests(conference_id,requested_by,subject,message)
  values(p_conference_id,(select auth.uid()),trim(p_subject),trim(p_message));
end;
$$;

revoke all on function public.owner_request_platform_support(uuid,text,text) from public;
grant execute on function public.owner_request_platform_support(uuid,text,text) to authenticated;
