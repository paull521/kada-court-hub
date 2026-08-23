-- TEST DATA ONLY. Never apply this file to a production KCH database.
-- Removes every season from any disposable test conference named
-- "KCH Basketball League" while preserving the conference and player pool.

delete from public.seasons season
using public.conferences conference
where season.conference_id=conference.id
  and conference.is_test=true
  and lower(trim(conference.name))='kch basketball league'
returning season.name as removed_season;

select conference.name,
       conference.slug,
       count(season.id) as remaining_seasons,
       count(distinct pool.player_id) as fictional_players
from public.conferences conference
left join public.seasons season on season.conference_id=conference.id
left join public.conference_player_pool pool on pool.conference_id=conference.id
where conference.is_test=true
  and lower(trim(conference.name))='kch basketball league'
group by conference.id,conference.name,conference.slug
order by conference.created_at;
