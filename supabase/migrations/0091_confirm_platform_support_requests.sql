-- Support requests remain visible to the owner until Platform confirms receipt.
alter table public.platform_support_requests
  add column if not exists received_at timestamptz;

alter table public.platform_support_requests
  drop constraint if exists platform_support_requests_status_check;

alter table public.platform_support_requests
  add constraint platform_support_requests_status_check
  check (status in ('open','received','resolved'));

create or replace function public.platform_confirm_support_request(p_request_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not public.is_platform_creator() then
    raise exception 'Platform Creator access is required.';
  end if;

  update public.platform_support_requests
  set status='received',received_at=coalesce(received_at,now())
  where id=p_request_id and status='open';

  if not found then
    raise exception 'The support request is no longer awaiting confirmation.';
  end if;
end;
$$;

revoke all on function public.platform_confirm_support_request(uuid) from public;
grant execute on function public.platform_confirm_support_request(uuid) to authenticated;
