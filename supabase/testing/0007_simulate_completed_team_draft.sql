-- TEST DATA ONLY: evenly drafts every eligible joining player to an active team.
-- Waitlisted, declined, and unanswered invitations remain unchanged and unassigned.
-- Run migration 0028 before this script.

do $$
declare
  v_season_id uuid;
  v_division record;
  v_invitation record;
  v_team_ids uuid[];
  v_team_count integer;
  v_position integer;
  v_capacity integer;
begin
  select season.id into v_season_id
  from public.seasons season
  join public.conferences conference on conference.id=season.conference_id
  where conference.name='KCH Basketball League'
    and season.canceled_at is null
    and season.setup_stage=5
  order by season.starts_on desc,season.id
  limit 1;

  if v_season_id is null then
    raise exception 'No KCH Basketball League season is currently at Step 7.';
  end if;

  for v_division in select id,name from public.divisions where season_id=v_season_id order by name loop
    select array_agg(team.id order by team.name) into v_team_ids
    from public.teams team where team.division_id=v_division.id and team.active;
    v_team_count:=coalesce(array_length(v_team_ids,1),0);
    if v_team_count=0 then continue; end if;

    select greatest(0,coalesce(broadcast.team_count*broadcast.players_per_team,0)-(
      select count(*) from public.registrations registration
      where registration.division_id=v_division.id and registration.team_id is not null
        and registration.status<>'inactive' and registration.role_label in ('Captain','Co-captain')
    )) into v_capacity
    from public.season_broadcasts broadcast
    where broadcast.division_id=v_division.id and broadcast.broadcast_type='player_invitation'
    order by broadcast.created_at desc limit 1;

    with ranked as (
      select invitation.id,row_number() over(order by invitation.responded_at nulls last,invitation.created_at,invitation.id) as position
      from public.season_invitations invitation
      where invitation.division_id=v_division.id and invitation.response='joining'
    )
    update public.season_invitations invitation
    set selection_status=case when ranked.position<=coalesce(v_capacity,0) then 'eligible' else 'waitlisted' end
    from ranked where ranked.id=invitation.id;

    update public.registrations set team_id=null,jersey_number=null,position=null,status='pending'
    where division_id=v_division.id and role_label='Player';

    v_position:=0;
    for v_invitation in
      select invitation.id,invitation.registration_id
      from public.season_invitations invitation
      where invitation.division_id=v_division.id
        and invitation.response='joining'
        and invitation.selection_status='eligible'
      order by invitation.responded_at nulls last,invitation.created_at,invitation.id
    loop
      v_position:=v_position+1;
      update public.registrations
      set team_id=v_team_ids[((v_position-1)%v_team_count)+1],
          division_id=v_division.id,
          status='pending',
          role_label='Player'
      where id=v_invitation.registration_id;
    end loop;

    with roster_order as (
      select registration.id,row_number() over(
        partition by registration.team_id
        order by case registration.role_label when 'Captain' then 0 when 'Co-captain' then 1 else 2 end,registration.created_at,registration.id
      ) as roster_position
      from public.registrations registration
      where registration.division_id=v_division.id and registration.team_id is not null and registration.status<>'inactive'
    )
    update public.registrations registration
    set jersey_number=case roster_order.roster_position
          when 1 then 3 when 2 then 5 when 3 then 7 when 4 then 9 when 5 then 11
          when 6 then 13 when 7 then 21 when 8 then 23 when 9 then 25 when 10 then 27
          else 30+roster_order.roster_position end,
        position=case (roster_order.roster_position-1)%5
          when 0 then 'Point Guard' when 1 then 'Shooting Guard' when 2 then 'Small Forward'
          when 3 then 'Power Forward' else 'Center' end
    from roster_order where roster_order.id=registration.id;

    update public.player_profiles player
    set preferred_uniform_size=coalesce(nullif(player.preferred_uniform_size,''),case mod(abs(hashtext(player.id::text)),4) when 0 then 'M' when 1 then 'L' when 2 then 'XL' else '2XL' end)
    where exists(select 1 from public.registrations registration where registration.player_id=player.id and registration.division_id=v_division.id and registration.team_id is not null);

    insert into public.team_roster_drafts(team_id,status,submitted_at,submitted_by,reviewed_at,reviewed_by,owner_note,updated_at)
    select team.id,'submitted',now(),(select auth.uid()),null,null,null,now()
    from public.teams team where team.division_id=v_division.id and team.active
    on conflict(team_id) do update set status='submitted',submitted_at=now(),submitted_by=(select auth.uid()),reviewed_at=null,reviewed_by=null,owner_note=null,updated_at=now();
  end loop;

  raise notice 'Completed draft simulation is waiting for owner approval.';
end;
$$;

select division.name as division,team.name as team,
       count(registration.id) filter(where registration.role_label='Player') as drafted_players,
       draft.status as roster_status
from public.teams team
join public.divisions division on division.id=team.division_id
join public.seasons season on season.id=division.season_id
join public.conferences conference on conference.id=season.conference_id
left join public.registrations registration on registration.team_id=team.id and registration.status<>'inactive'
left join public.team_roster_drafts draft on draft.team_id=team.id
where conference.name='KCH Basketball League' and season.canceled_at is null and season.setup_stage=5
group by division.name,team.name,draft.status
order by division.name,team.name;
