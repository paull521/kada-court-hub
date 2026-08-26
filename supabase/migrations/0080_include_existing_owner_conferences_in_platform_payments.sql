-- Existing KCH conferences may predate platform_owner_records. Include their
-- real owner membership/profile in the Platform payment ledger view.
create or replace function public.platform_owner_payment_billing()
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_conference record; v_result jsonb:='[]'::jsonb; v_billing jsonb; v_owner record;
begin
  if not public.is_platform_creator() then return '[]'::jsonb; end if;
  for v_conference in
    select conference.id,conference.name from public.conferences conference
    where coalesce(conference.is_test,false)=false
      and exists(select 1 from public.conference_memberships membership where membership.conference_id=conference.id and membership.role='owner')
    order by conference.name
  loop
    perform public.ensure_owner_payment_ledger(v_conference.id);
    select coalesce(record.full_name,profile.display_name,'Conference Owner') as full_name,
      coalesce(record.email,'') as email,coalesce(record.phone,'') as phone
    into v_owner
    from public.conference_memberships membership
    join public.profiles profile on profile.id=membership.profile_id
    left join public.platform_owner_records record on record.conference_id=membership.conference_id or record.profile_id=membership.profile_id
    where membership.conference_id=v_conference.id and membership.role='owner'
    order by record.created_at nulls last,membership.created_at
    limit 1;
    select jsonb_build_object(
      'entries',coalesce(jsonb_agg(jsonb_build_object('id',entry.id,'chargeType',entry.charge_type,'label',entry.label,
        'amountCents',entry.amount_cents,'paidCents',entry.paid_cents,'balanceCents',entry.amount_cents-entry.paid_cents,
        'status',entry.status,'dueOn',entry.due_on) order by entry.due_on nulls last,entry.created_at),'[]'::jsonb),
      'submissions',(select coalesce(jsonb_agg(jsonb_build_object('id',submission.id,'amountCents',submission.amount_cents,
        'method',submission.method,'status',submission.status,'submittedAt',submission.submitted_at) order by submission.submitted_at desc),'[]'::jsonb)
        from public.conference_subscription_payment_submissions submission where submission.conference_id=v_conference.id)
    ) into v_billing from public.owner_payment_ledger entry where entry.conference_id=v_conference.id;
    v_result:=v_result||jsonb_build_array(jsonb_build_object('conferenceId',v_conference.id,'conferenceName',v_conference.name,
      'ownerName',coalesce(v_owner.full_name,'Conference Owner'),'email',coalesce(v_owner.email,''),'phone',coalesce(v_owner.phone,''),'billing',v_billing));
  end loop;
  return v_result;
end;$$;

revoke all on function public.platform_owner_payment_billing() from public;
grant execute on function public.platform_owner_payment_billing() to authenticated;
