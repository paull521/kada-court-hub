-- Platform Creator needs to see every owner conference, including test/demo
-- conferences, so pending owner submissions can always be reviewed.
create or replace function public.platform_owner_payment_billing()
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_conference record; v_result jsonb:='[]'::jsonb; v_billing jsonb; v_owner record;
begin
  if not public.is_platform_creator() then return '[]'::jsonb; end if;
  for v_conference in select conference.id,conference.name from public.conferences conference join public.platform_owner_records owner on owner.conference_id=conference.id order by conference.name loop
    perform public.ensure_owner_payment_ledger(v_conference.id);
    select coalesce(owner.full_name,profile.display_name,'Conference Owner') as full_name,coalesce(owner.email,'') as email,coalesce(owner.phone,'') as phone into v_owner
    from public.platform_owner_records owner left join public.profiles profile on profile.id=owner.profile_id where owner.conference_id=v_conference.id order by owner.created_at limit 1;
    select jsonb_build_object('entries',coalesce(jsonb_agg(jsonb_build_object('id',entry.id,'chargeType',entry.charge_type,'label',entry.label,'amountCents',entry.amount_cents,'paidCents',entry.paid_cents,'balanceCents',entry.amount_cents-entry.paid_cents,'status',entry.status,'dueOn',entry.due_on) order by entry.due_on nulls last,entry.created_at),'[]'::jsonb),'submissions',(select coalesce(jsonb_agg(jsonb_build_object('id',submission.id,'amountCents',submission.amount_cents,'method',submission.method,'status',submission.status,'submittedAt',submission.submitted_at) order by submission.submitted_at desc),'[]'::jsonb) from public.conference_subscription_payment_submissions submission where submission.conference_id=v_conference.id)) into v_billing from public.owner_payment_ledger entry where entry.conference_id=v_conference.id;
    v_result:=v_result||jsonb_build_array(jsonb_build_object('conferenceId',v_conference.id,'conferenceName',v_conference.name,'ownerName',coalesce(v_owner.full_name,'Conference Owner'),'email',coalesce(v_owner.email,''),'phone',coalesce(v_owner.phone,''),'billing',v_billing));
  end loop;
  return v_result;
end;$$;

revoke all on function public.platform_owner_payment_billing() from public;
grant execute on function public.platform_owner_payment_billing() to authenticated;
