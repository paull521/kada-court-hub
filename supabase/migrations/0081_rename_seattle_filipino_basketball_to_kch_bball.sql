-- Rename the existing conference without changing its ID, memberships, seasons,
-- registrations, or payment ledger relationships.
update public.conferences
set name='KCH Bball'
where name='Seattle Filipino Basketball';
