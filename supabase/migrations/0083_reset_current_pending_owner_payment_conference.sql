-- Approved test reset for the one conference that currently has an owner
-- payment awaiting Platform confirmation. It also gives that conference the
-- agreed KCH Bball name.
do $$
declare v_conference_id uuid; v_pending_count integer;
begin
  select count(distinct conference_id) into v_pending_count
  from public.conference_subscription_payment_submissions where status='pending';
  if v_pending_count<>1 then raise exception 'Expected exactly one pending owner payment; found %.',v_pending_count; end if;

  select conference_id into v_conference_id
  from public.conference_subscription_payment_submissions where status='pending' limit 1;

  update public.conferences set name='KCH Bball' where id=v_conference_id;
  delete from public.conference_subscription_payment_submissions
  where conference_id=v_conference_id and status='pending';
  delete from public.owner_payment_ledger where conference_id=v_conference_id;

  insert into public.owner_payment_ledger(conference_id,ledger_key,charge_type,label,amount_cents,paid_cents,status,due_on)
  values
    (v_conference_id,'subscription:'||to_char(date_trunc('month',current_date),'YYYY-MM'),'subscription',
      'Monthly subscription - '||to_char(date_trunc('month',current_date),'FMMonth YYYY'),5000,5000,'paid',date_trunc('month',current_date)::date),
    (v_conference_id,'platform-fee:manual-test','platform_fee','Platform fee - test balance',3000,0,'due',current_date);
end;$$;
