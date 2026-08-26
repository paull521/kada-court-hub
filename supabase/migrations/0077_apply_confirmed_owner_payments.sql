create or replace function public.apply_confirmed_owner_payment(p_conference_id uuid,p_amount_cents integer)
returns void language plpgsql security definer set search_path='' as $$
declare r public.owner_payment_ledger%rowtype; v_left integer:=p_amount_cents; v_paid integer;
begin
  for r in select * from public.owner_payment_ledger where conference_id=p_conference_id and status<>'paid' order by due_on nulls last,created_at for update loop
    exit when v_left<=0;
    v_paid:=least(v_left,r.amount_cents-r.paid_cents);
    update public.owner_payment_ledger set paid_cents=paid_cents+v_paid,status=case when paid_cents+v_paid>=amount_cents then 'paid' when paid_cents+v_paid>0 then 'partial' else 'due' end,updated_at=now() where id=r.id;
    v_left:=v_left-v_paid;
  end loop;
end;$$;
