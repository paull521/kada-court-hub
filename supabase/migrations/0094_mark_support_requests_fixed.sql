-- Platform can close a received request without adding a separate response.
create or replace function public.platform_mark_support_request_fixed(p_request_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not public.is_platform_creator() then
    raise exception 'Platform Creator access is required.';
  end if;

  update public.platform_support_requests
  set status='resolved',resolved_at=now()
  where id=p_request_id and status='received';

  if not found then
    raise exception 'The support request must be confirmed before it can be marked fixed.';
  end if;
end;
$$;

revoke all on function public.platform_mark_support_request_fixed(uuid) from public;
grant execute on function public.platform_mark_support_request_fixed(uuid) to authenticated;
