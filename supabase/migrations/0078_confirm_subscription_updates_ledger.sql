create or replace function public.platform_review_subscription_payment(p_submission_id uuid,p_decision text)
returns void language plpgsql security definer set search_path='' as $$
declare v_submission public.conference_subscription_payment_submissions%rowtype;
begin
 if not public.is_platform_creator() then raise exception 'Platform Creator access is required.'; end if;
 if p_decision not in('confirmed','declined') then raise exception 'Choose Confirmed or Declined.'; end if;
 select * into v_submission from public.conference_subscription_payment_submissions where id=p_submission_id for update;
 if v_submission.id is null or v_submission.status<>'pending' then raise exception 'Payment submission is not available.'; end if;
 update public.conference_subscription_payment_submissions set status=p_decision,reviewed_by=(select auth.uid()),reviewed_at=now() where id=p_submission_id;
 if p_decision='confirmed' then
   perform public.apply_confirmed_owner_payment(v_submission.conference_id,v_submission.amount_cents);
   insert into public.conference_subscriptions(conference_id,status,paid_through,updated_at) values(v_submission.conference_id,'paid',(current_date+interval '1 month')::date,now()) on conflict(conference_id) do update set status='paid',paid_through=greatest(coalesce(conference_subscriptions.paid_through,current_date),(current_date+interval '1 month')::date),updated_at=now();
 end if;
end;$$;
