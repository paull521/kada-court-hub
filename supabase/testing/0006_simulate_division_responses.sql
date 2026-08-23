-- TEST DATA ONLY. Simulates the Step 7 response pools requested for two divisions.
-- Division A: 60 invited, 55 joining, first 40 eligible, 15 waitlisted.
-- Division B: 60 invited, 45 joining, first 36 eligible, 9 waitlisted.
-- The two eligible pools intentionally share 15 players.

do $$
declare
  v_conference_id uuid;
  v_season_id uuid;
  v_division_a uuid;
  v_division_b uuid;
  v_broadcast_a uuid;
  v_broadcast_b uuid;
begin
  select season.conference_id,season.id into v_conference_id,v_season_id
  from public.seasons season
  join public.conferences conference on conference.id=season.conference_id
  join public.divisions division on division.season_id=season.id
  left join public.season_broadcasts broadcast on broadcast.division_id=division.id and broadcast.broadcast_type='player_invitation'
  where conference.is_test=true and lower(trim(conference.name))='kch basketball league' and season.canceled_at is null
  group by season.id,season.conference_id,season.starts_on
  having count(distinct division.id)>=2 and count(distinct broadcast.division_id)>=2
  order by season.starts_on desc
  limit 1;
  if v_season_id is null then raise exception 'No KCH test season with two invited divisions was found.'; end if;
  select division.id into v_division_a from public.divisions division
  where division.season_id=v_season_id and exists(select 1 from public.season_broadcasts broadcast where broadcast.division_id=division.id and broadcast.broadcast_type='player_invitation')
  order by division.name limit 1;
  select division.id into v_division_b from public.divisions division
  where division.season_id=v_season_id and exists(select 1 from public.season_broadcasts broadcast where broadcast.division_id=division.id and broadcast.broadcast_type='player_invitation')
  order by division.name offset 1 limit 1;
  if v_division_a is null or v_division_b is null then raise exception 'Create two divisions and send both invitations first.'; end if;
  select broadcast.id into v_broadcast_a from public.season_broadcasts broadcast where broadcast.division_id=v_division_a and broadcast.broadcast_type='player_invitation' order by broadcast.created_at desc limit 1;
  select broadcast.id into v_broadcast_b from public.season_broadcasts broadcast where broadcast.division_id=v_division_b and broadcast.broadcast_type='player_invitation' order by broadcast.created_at desc limit 1;
  if v_broadcast_a is null or v_broadcast_b is null then raise exception 'Send an invitation for both divisions before simulating responses.'; end if;

  create temporary table kch_sim_players on commit drop as
  select pool.player_id,row_number() over(order by player.public_player_id) as rn
  from public.conference_player_pool pool join public.player_profiles player on player.id=pool.player_id
  where pool.conference_id=v_conference_id and not exists(
    select 1 from public.registrations registration where registration.season_id=v_season_id and registration.player_id=pool.player_id and registration.team_id is not null
  );
  if (select count(*) from kch_sim_players)<105 then raise exception 'At least 105 unassigned test players are required.'; end if;

  delete from public.season_invitations invitation where invitation.division_id in(v_division_a,v_division_b);
  insert into public.season_invitations(broadcast_id,season_id,division_id,player_id,registration_id,response,selection_status,responded_at)
  select v_broadcast_a,v_season_id,v_division_a,player_id,null,
    case when rn<=55 then 'joining' else 'pending' end,
    case when rn<=40 then 'eligible' when rn<=55 then 'waitlisted' else 'awaiting_response' end,
    case when rn<=55 then now()-(rn||' minutes')::interval else null end
  from kch_sim_players where rn between 1 and 60;
  insert into public.season_invitations(broadcast_id,season_id,division_id,player_id,registration_id,response,selection_status,responded_at)
  select v_broadcast_b,v_season_id,v_division_b,player_id,null,
    case when sequence_number<=45 then 'joining' else 'pending' end,
    case when sequence_number<=36 then 'eligible' when sequence_number<=45 then 'waitlisted' else 'awaiting_response' end,
    case when sequence_number<=45 then now()-(sequence_number||' minutes')::interval else null end
  from (
    select player_id,rn as sequence_number from kch_sim_players where rn between 1 and 15
    union all
    select player_id,rn-45 as sequence_number from kch_sim_players where rn between 61 and 105
  ) planned;

  insert into public.registrations(player_id,season_id,team_id,status,role_label)
  select distinct invitation.player_id,v_season_id,null::uuid,'pending'::public.registration_status,'Player'
  from public.season_invitations invitation
  where invitation.season_id=v_season_id and invitation.response='joining'
  on conflict(player_id,season_id) do update set status='pending';
  update public.season_invitations invitation set registration_id=registration.id
  from public.registrations registration
  where invitation.season_id=v_season_id and invitation.response='joining'
    and registration.season_id=v_season_id and registration.player_id=invitation.player_id;
  update public.season_broadcasts set invited_count=60 where id in(v_broadcast_a,v_broadcast_b);
  update public.seasons set setup_stage=5 where id=v_season_id;
end;
$$;

select division.name as division,
       count(*) as invited,
       count(*) filter(where invitation.response<>'pending') as responded,
       count(*) filter(where invitation.selection_status='eligible') as draft_pool,
       count(*) filter(where invitation.selection_status='waitlisted') as waitlisted,
       count(*) filter(where invitation.selection_status='awaiting_response') as awaiting_response
from public.season_invitations invitation
join public.divisions division on division.id=invitation.division_id
join public.seasons season on season.id=invitation.season_id
join public.conferences conference on conference.id=season.conference_id
where conference.is_test=true and lower(trim(conference.name))='kch basketball league'
group by division.id,division.name
order by division.name;
