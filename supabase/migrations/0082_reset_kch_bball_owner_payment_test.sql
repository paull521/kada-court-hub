-- Approved local-payment test reset for KCH Bball.
-- This affects only this conference's owner ledger and pending owner submission.
do $$
declare v_conference_id uuid;
begin
  select id into v_conference_id from public.conferences where name='KCH Bball' limit 1;
  if v_conference_id is null then raise exception 'KCH Bball conference was not found.'; end if;

  delete from public.conference_subscription_payment_submissions
  where conference_id=v_conference_id and status='pending';

  delete from public.owner_payment_ledger where conference_id=v_conference_id;

  insert into public.owner_payment_ledger(conference_id,ledger_key,charge_type,label,amount_cents,paid_cents,status,due_on)
  values
    (v_conference_id,'subscription:'||to_char(date_trunc('month',current_date),'YYYY-MM'),'subscription',
      'Monthly subscription - '||to_char(date_trunc('month',current_date),'FMMonth YYYY'),5000,5000,'paid',date_trunc('month',current_date)::date),
    (v_conference_id,'platform-fee:manual-test','platform_fee','Platform fee - test balance',3000,0,'due',current_date);
end;$$;
