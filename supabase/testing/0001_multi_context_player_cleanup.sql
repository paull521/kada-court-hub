-- Removes only the isolated switcher test season and everything below it.
delete from public.seasons
where name = 'Fall 2026 — Switcher Test'
  and conference_id = (
    select id from public.conferences
    where slug = 'seattle-filipino-basketball-league'
  );
