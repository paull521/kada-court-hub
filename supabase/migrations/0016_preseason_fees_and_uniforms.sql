-- Season/division-specific fee and uniform setup before player invitations.

alter table public.seasons add column if not exists preseason_ready boolean not null default false;
update public.seasons set preseason_ready = true where setup_stage >= 5;

create table if not exists public.division_financial_settings (
  division_id uuid primary key references public.divisions(id) on delete cascade,
  league_fee_enabled boolean not null default true,
  league_fee_cents integer check (league_fee_cents is null or league_fee_cents >= 0),
  uniform_fee_enabled boolean not null default true,
  uniform_fee_cents integer check (uniform_fee_cents is null or uniform_fee_cents >= 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id),
  check (not league_fee_enabled or league_fee_cents is not null),
  check (not uniform_fee_enabled or uniform_fee_cents is not null)
);
alter table public.division_financial_settings enable row level security;
grant select on public.division_financial_settings to authenticated;
drop policy if exists "Conference members view division financial settings" on public.division_financial_settings;
create policy "Conference members view division financial settings" on public.division_financial_settings for select to authenticated
using (exists (
  select 1 from public.divisions division
  join public.seasons season on season.id = division.season_id
  where division.id = division_financial_settings.division_id
    and public.user_belongs_to_conference(season.conference_id)
));

create or replace function public.owner_update_division_preseason_details(
  p_division_id uuid,
  p_league_fee_enabled boolean,
  p_league_fee_cents integer,
  p_uniform_fee_enabled boolean,
  p_uniform_fee_cents integer,
  p_dark_image_path text default null,
  p_light_image_path text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conference_id uuid;
  v_stage smallint;
begin
  select season.conference_id, season.setup_stage into v_conference_id, v_stage
  from public.divisions division
  join public.seasons season on season.id = division.season_id
  where division.id = p_division_id;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id, array['owner']::public.conference_role[]) then
    raise exception 'Only a conference owner can update preseason details.';
  end if;
  if v_stage <> 4 then raise exception 'Fees and uniforms are set after captains and before player invitations.'; end if;
  if p_league_fee_enabled and (p_league_fee_cents is null or p_league_fee_cents < 0) then raise exception 'Enter the league fee.'; end if;
  if p_uniform_fee_enabled and (p_uniform_fee_cents is null or p_uniform_fee_cents < 0) then raise exception 'Enter the uniform fee.'; end if;

  insert into public.division_financial_settings
    (division_id,league_fee_enabled,league_fee_cents,uniform_fee_enabled,uniform_fee_cents,updated_by)
  values
    (p_division_id,p_league_fee_enabled,case when p_league_fee_enabled then p_league_fee_cents else null end,
     p_uniform_fee_enabled,case when p_uniform_fee_enabled then p_uniform_fee_cents else null end,(select auth.uid()))
  on conflict (division_id) do update set
    league_fee_enabled=excluded.league_fee_enabled,
    league_fee_cents=excluded.league_fee_cents,
    uniform_fee_enabled=excluded.uniform_fee_enabled,
    uniform_fee_cents=excluded.uniform_fee_cents,
    updated_at=now(),updated_by=(select auth.uid());

  insert into public.division_uniform_settings (division_id,dark_image_path,light_image_path,updated_by)
  values (p_division_id,nullif(p_dark_image_path,''),nullif(p_light_image_path,''),(select auth.uid()))
  on conflict (division_id) do update set
    dark_image_path=coalesce(nullif(p_dark_image_path,''),division_uniform_settings.dark_image_path),
    light_image_path=coalesce(nullif(p_light_image_path,''),division_uniform_settings.light_image_path),
    updated_at=now(),updated_by=(select auth.uid());

  insert into public.activity_log (conference_id,actor_profile_id,action,entity_type,entity_id,summary)
  values (v_conference_id,(select auth.uid()),'update','division_preseason',p_division_id::text,'Updated division fees and uniform photos');
end;
$$;

create or replace function public.owner_complete_preseason_details(p_season_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conference_id uuid;
  v_stage smallint;
begin
  select conference_id,setup_stage into v_conference_id,v_stage from public.seasons where id=p_season_id for update;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then
    raise exception 'Only a conference owner can complete preseason details.';
  end if;
  if v_stage <> 4 then raise exception 'Complete captains before fees and uniforms.'; end if;
  if exists (
    select 1 from public.divisions division
    left join public.division_financial_settings financial on financial.division_id=division.id
    left join public.division_uniform_settings uniform_setting on uniform_setting.division_id=division.id
    where division.season_id=p_season_id and (
      financial.division_id is null
      or uniform_setting.dark_image_path is null
      or uniform_setting.light_image_path is null
    )
  ) then raise exception 'Save fees and both uniform photos for every division.'; end if;
  update public.seasons set preseason_ready=true where id=p_season_id;
  insert into public.activity_log (conference_id,actor_profile_id,action,entity_type,entity_id,summary)
  values (v_conference_id,(select auth.uid()),'complete','season_preseason',p_season_id::text,'Locked preseason fees and uniform package');
end;
$$;

-- Create the season-specific player charges when the roster draft is published.
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

revoke all on function public.owner_update_division_preseason_details(uuid,boolean,integer,boolean,integer,text,text) from public;
revoke all on function public.owner_complete_preseason_details(uuid) from public;
grant execute on function public.owner_update_division_preseason_details(uuid,boolean,integer,boolean,integer,text,text) to authenticated;
grant execute on function public.owner_complete_preseason_details(uuid) to authenticated;
