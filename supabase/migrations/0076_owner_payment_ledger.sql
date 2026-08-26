-- Month-by-month owner subscription and season platform-fee ledger.
create table if not exists public.owner_payment_ledger(
 id uuid primary key default gen_random_uuid(),conference_id uuid not null references public.conferences(id) on delete cascade,
 charge_type text not null check(charge_type in('subscription','platform_fee')),
 label text not null,amount_cents integer not null check(amount_cents>=0),paid_cents integer not null default 0 check(paid_cents>=0),status text not null default 'due' check(status in('due','partial','paid')),
 due_on date,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
alter table public.owner_payment_ledger enable row level security;
create policy "Owners view own payment ledger" on public.owner_payment_ledger for select to authenticated using(public.user_has_conference_role(conference_id,array['owner']::public.conference_role[]));
create policy "Platform manages payment ledger" on public.owner_payment_ledger for all to authenticated using(public.is_platform_creator()) with check(public.is_platform_creator());
