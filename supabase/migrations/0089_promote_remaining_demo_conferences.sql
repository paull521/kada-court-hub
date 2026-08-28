-- Promote the two retained demo conferences so Platform Overview includes them.
-- This changes only the test flag; all existing conference data remains intact.

update public.conferences
set is_test=false
where name in ('KCH Bball Test','KCH Basketball League')
returning name,is_test;
