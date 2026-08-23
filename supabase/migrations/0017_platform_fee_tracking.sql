-- Add the standard KCH platform fee to every active season/division roster.
alter table public.division_financial_settings
  add column if not exists platform_fee_cents integer not null default 100
  check (platform_fee_cents >= 0);

-- Backfill published test and live rosters without changing existing payments.
insert into public.fees (registration_id,category,description,amount_cents,status,due_on)
select registration.id,'platform',division.name||' Platform Fee',financial.platform_fee_cents,'due',season.starts_on
from public.registrations registration
join public.teams team on team.id=registration.team_id
join public.divisions division on division.id=team.division_id
join public.seasons season on season.id=registration.season_id
join public.division_financial_settings financial on financial.division_id=division.id
where registration.status='active'
  and not exists (
    select 1 from public.fees fee
    where fee.registration_id=registration.id and fee.category='platform'
  );

-- Include the platform fee automatically when future roster drafts are published.
create or replace function public.owner_publish_roster_draft(p_season_id uuid, p_message text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conference_id uuid;
  v_season_name text;
  v_stage smallint;
  v_message text := nullif(trim(p_message), '');
  v_broadcast_id uuid;
begin
  select conference_id,name,setup_stage into v_conference_id,v_season_name,v_stage
  from public.seasons where id=p_season_id for update;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then
    raise exception 'Only a conference owner can publish roster drafts.';
  end if;
  if v_stage <> 5 then raise exception 'Invite players before publishing the roster draft.'; end if;
  if v_message is null or char_length(v_message)>1000 then raise exception 'Enter a roster message of 1 to 1000 characters.'; end if;
  if exists (
    select 1 from public.season_invitations invitation
    left join public.registrations registration on registration.id=invitation.registration_id
    where invitation.season_id=p_season_id and invitation.response='joining' and registration.team_id is null
  ) then raise exception 'Assign every joining player to a team before completing the draft.'; end if;

  insert into public.season_broadcasts (season_id,message,created_by,broadcast_type)
  values (p_season_id,v_message,(select auth.uid()),'roster_draft') returning id into v_broadcast_id;
  update public.registrations set status='active' where season_id=p_season_id and team_id is not null;

  insert into public.fees (registration_id,category,description,amount_cents,status,due_on)
  select registration.id,'league',division.name||' League Fee',financial.league_fee_cents,'due',season.starts_on
  from public.registrations registration
  join public.teams team on team.id=registration.team_id
  join public.divisions division on division.id=team.division_id
  join public.seasons season on season.id=registration.season_id
  join public.division_financial_settings financial on financial.division_id=division.id
  where registration.season_id=p_season_id and registration.status='active' and financial.league_fee_enabled
    and not exists (select 1 from public.fees fee where fee.registration_id=registration.id and fee.category='league');

  insert into public.fees (registration_id,category,description,amount_cents,status,due_on)
  select registration.id,'uniform',division.name||' Uniform Fee',financial.uniform_fee_cents,'due',season.starts_on
  from public.registrations registration
  join public.teams team on team.id=registration.team_id
  join public.divisions division on division.id=team.division_id
  join public.seasons season on season.id=registration.season_id
  join public.division_financial_settings financial on financial.division_id=division.id
  where registration.season_id=p_season_id and registration.status='active' and financial.uniform_fee_enabled
    and not exists (select 1 from public.fees fee where fee.registration_id=registration.id and fee.category='uniform');

  insert into public.fees (registration_id,category,description,amount_cents,status,due_on)
  select registration.id,'platform',division.name||' Platform Fee',financial.platform_fee_cents,'due',season.starts_on
  from public.registrations registration
  join public.teams team on team.id=registration.team_id
  join public.divisions division on division.id=team.division_id
  join public.seasons season on season.id=registration.season_id
  join public.division_financial_settings financial on financial.division_id=division.id
  where registration.season_id=p_season_id and registration.status='active'
    and not exists (select 1 from public.fees fee where fee.registration_id=registration.id and fee.category='platform');

  insert into public.notifications (profile_id,notification_type,title,body,link_path,entity_id)
  select distinct player.profile_id,'roster_draft_published',v_season_name||' roster draft',v_message,'/my-team',v_broadcast_id
  from public.registrations registration join public.player_profiles player on player.id=registration.player_id
  where registration.season_id=p_season_id and player.profile_id is not null
  on conflict (profile_id,notification_type,entity_id) do update
    set title=excluded.title,body=excluded.body,link_path=excluded.link_path,read_at=null,created_at=now();
  update public.seasons set setup_stage=6,registration_open=false where id=p_season_id;
  insert into public.activity_log (conference_id,actor_profile_id,action,entity_type,entity_id,summary)
  values (v_conference_id,(select auth.uid()),'publish','roster_draft',v_broadcast_id::text,'Published roster draft for '||v_season_name);
  return v_broadcast_id;
end;
$$;

revoke all on function public.owner_publish_roster_draft(uuid,text) from public;
grant execute on function public.owner_publish_roster_draft(uuid,text) to authenticated;
