-- WAPinoy game uniform rule: home team wears White; away team wears Dark.

update public.games game
set home_uniform='White',away_uniform='Dark'
from public.seasons season
join public.conferences conference on conference.id=season.conference_id
where game.season_id=season.id
  and conference.slug='wapinoy'
  and season.name='Cardio Friday Season IV';
