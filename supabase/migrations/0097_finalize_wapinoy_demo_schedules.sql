-- The imported WAPinoy schedules are approved demo schedules and must be visible
-- to the rostered player and captain views.

insert into public.division_schedule_workflows(division_id,mode,status,finalized_at,updated_by)
select division.id,'manual','final',now(),owner_record.profile_id
from public.divisions division
join public.seasons season on season.id=division.season_id
join public.conferences conference on conference.id=season.conference_id
left join public.platform_owner_records owner_record on owner_record.conference_id=conference.id
where conference.slug='wapinoy'
  and season.name='Cardio Friday Season IV'
  and division.name in ('East','West','40 Over')
on conflict(division_id) do update set
  mode='manual',
  status='final',
  finalized_at=now(),
  updated_at=now(),
  updated_by=excluded.updated_by;
