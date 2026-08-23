-- TEST DATA ONLY. Approves Team B and makes its division ready for final roster publication.

do $$
declare
  v_team_id uuid;
  v_division_id uuid;
begin
  select team.id,team.division_id into v_team_id,v_division_id
  from public.teams team
  join public.divisions division on division.id=team.division_id
  join public.seasons season on season.id=division.season_id
  join public.conferences conference on conference.id=season.conference_id
  where conference.is_test
    and season.canceled_at is null
    and lower(team.name)='team b'
    and exists(select 1 from public.season_broadcasts broadcast where broadcast.division_id=division.id and broadcast.broadcast_type='roster_draft')
  order by season.starts_on desc
  limit 1;
  if v_team_id is null then raise exception 'Team B was not found in a shared test division roster.'; end if;

  insert into public.team_roster_drafts(team_id,status,reviewed_at,updated_at)
  values(v_team_id,'approved',now(),now())
  on conflict(team_id) do update
  set status='approved',owner_note=null,reviewed_at=now(),updated_at=now();

  update public.season_broadcasts broadcast
  set response_deadline=current_date
  where broadcast.division_id=v_division_id and broadcast.broadcast_type='roster_draft';
end;
$$;

select division.name as division,team.name as team,draft.status as team_status,broadcast.response_deadline as review_deadline,
  case when not exists(
    select 1 from public.teams division_team
    left join public.team_roster_drafts division_draft on division_draft.team_id=division_team.id
    where division_team.division_id=division.id and division_team.active and coalesce(division_draft.status,'editing')<>'approved'
  ) then 'Ready to publish final roster' else 'Other teams still need approval' end as next_action
from public.teams team
join public.divisions division on division.id=team.division_id
join public.team_roster_drafts draft on draft.team_id=team.id
join public.season_broadcasts broadcast on broadcast.division_id=division.id and broadcast.broadcast_type='roster_draft'
where lower(team.name)='team b'
order by broadcast.created_at desc
limit 1;
