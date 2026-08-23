-- TEST DATA ONLY. Never apply this file to a production KCH database.
-- Reopens the disposable D-League test schedule as a Step 8 draft.
-- Existing teams, players, games, scores, and uniforms are preserved.

update public.seasons
set setup_stage = 6,
    registration_open = false
where name = 'Fall 2026 — Switcher Test';

select
  season.name as test_season,
  season.setup_stage,
  count(game.id) as preserved_games,
  case when season.setup_stage = 6 then 'DRAFT' else 'CHECK STATUS' end as schedule_status
from public.seasons season
left join public.games game on game.season_id = season.id
where season.name = 'Fall 2026 — Switcher Test'
group by season.id, season.name, season.setup_stage;
