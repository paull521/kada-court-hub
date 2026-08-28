-- The imported WAPinoy 40 Over source roster is approved for the demo.

insert into public.season_broadcasts(season_id,division_id,message,created_by,broadcast_type)
select season.id,division.id,'The Cardio Friday Season IV · 40 Over final roster is now published.',owner_record.profile_id,'roster_final'
from public.conferences conference
join public.seasons season on season.conference_id=conference.id
join public.divisions division on division.season_id=season.id
join public.platform_owner_records owner_record on owner_record.conference_id=conference.id
where conference.slug='wapinoy'
  and season.name='Cardio Friday Season IV'
  and division.name='40 Over'
  and not exists(
    select 1 from public.season_broadcasts broadcast
    where broadcast.division_id=division.id and broadcast.broadcast_type='roster_final'
  );
