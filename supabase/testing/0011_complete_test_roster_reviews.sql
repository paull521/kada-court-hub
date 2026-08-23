-- TEST DATA ONLY. Simulates captain resubmission and owner approval for all test teams.
-- Final roster publication remains an owner action in the KCH interface.

update public.team_roster_drafts draft
set status='approved',owner_note=null,submitted_at=coalesce(draft.submitted_at,now()),reviewed_at=now(),updated_at=now()
from public.teams team
join public.divisions division on division.id=team.division_id
join public.seasons season on season.id=division.season_id
join public.conferences conference on conference.id=season.conference_id
where draft.team_id=team.id and conference.is_test and season.canceled_at is null and team.active;

update public.season_broadcasts broadcast
set response_deadline=current_date
from public.divisions division
join public.seasons season on season.id=division.season_id
join public.conferences conference on conference.id=season.conference_id
where broadcast.division_id=division.id and broadcast.broadcast_type='roster_draft'
  and conference.is_test and season.canceled_at is null;

select season.name as season,division.name as division,
  count(*) filter(where draft.status='approved') as approved_teams,
  count(*) filter(where draft.status<>'approved' or draft.status is null) as teams_still_pending,
  max(broadcast.response_deadline) as review_deadline
from public.divisions division
join public.seasons season on season.id=division.season_id
join public.conferences conference on conference.id=season.conference_id
join public.teams team on team.division_id=division.id and team.active
left join public.team_roster_drafts draft on draft.team_id=team.id
left join public.season_broadcasts broadcast on broadcast.division_id=division.id and broadcast.broadcast_type='roster_draft'
where conference.is_test and season.canceled_at is null
group by season.id,season.name,division.id,division.name
order by season.starts_on desc,division.name;
