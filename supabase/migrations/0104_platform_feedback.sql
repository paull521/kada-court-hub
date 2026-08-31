create table if not exists public.platform_feedback(
  id uuid primary key default gen_random_uuid(),
  conference_id uuid not null references public.conferences(id) on delete cascade,
  submitted_by uuid not null references public.profiles(id) on delete cascade,
  message text not null check(char_length(trim(message)) between 2 and 1000),
  created_at timestamptz not null default now()
);
alter table public.platform_feedback enable row level security;
create policy "Players view own platform feedback" on public.platform_feedback for select to authenticated using(submitted_by=(select auth.uid()));
create or replace function public.submit_platform_feedback(p_conference_id uuid,p_message text)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not public.user_belongs_to_conference(p_conference_id) then raise exception 'You do not belong to this conference.'; end if;
  insert into public.platform_feedback(conference_id,submitted_by,message) values(p_conference_id,(select auth.uid()),trim(p_message));
end;
$$;
create or replace function public.platform_owner_operations()
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_owners jsonb;v_candidates jsonb;v_directory jsonb;v_support jsonb;v_feedback jsonb;
begin
  if not public.is_platform_creator() then return jsonb_build_object('authorized',false); end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',record.id,'conferenceId',record.conference_id,'conferenceName',conference.name,'name',record.full_name,'email',record.email,'phone',record.phone,'status',record.status,'subscriptionStartsOn',record.subscription_starts_on,'subscriptionEndsOn',record.subscription_ends_on) order by record.created_at desc),'[]'::jsonb) into v_owners from public.platform_owner_records record join public.conferences conference on conference.id=record.conference_id;
  select coalesce(jsonb_agg(jsonb_build_object('id',record.id,'name',record.full_name,'email',record.email,'phone',record.phone,'contractSignedAt',ack.signed_at) order by ack.signed_at desc),'[]'::jsonb) into v_candidates from public.platform_owner_records record join public.platform_owner_contract_acknowledgments ack on ack.owner_record_id=record.id where record.conference_id is null;
  select coalesce(jsonb_agg(jsonb_build_object('conference',conference.name,'activeDivisions',active_divisions.count,'inactiveDivisions',inactive_divisions.count,'activePlayers',active_players.count,'inactivePlayers',inactive_players.count) order by conference.name),'[]'::jsonb) into v_directory from public.conferences conference left join lateral(select count(*) from public.divisions division join public.seasons season on season.id=division.season_id where season.conference_id=conference.id and season.canceled_at is null and season.ends_on>=current_date) active_divisions(count) on true left join lateral(select count(*) from public.divisions division join public.seasons season on season.id=division.season_id where season.conference_id=conference.id and(season.canceled_at is not null or season.ends_on<current_date)) inactive_divisions(count) on true left join lateral(select count(distinct registration.player_id) from public.registrations registration join public.seasons season on season.id=registration.season_id where season.conference_id=conference.id and registration.status='active' and season.canceled_at is null and season.starts_on<=current_date and season.ends_on>=current_date) active_players(count) on true left join lateral(select count(distinct registration.player_id) from public.registrations registration join public.seasons season on season.id=registration.season_id where season.conference_id=conference.id and (registration.status<>'active' or season.canceled_at is not null or season.ends_on<current_date)) inactive_players(count) on true where coalesce(conference.is_test,false)=false;
  select coalesce(jsonb_agg(jsonb_build_object('id',request.id,'conferenceName',conference.name,'ownerName',profile.display_name,'subject',request.subject,'message',request.message,'status',request.status,'createdAt',request.created_at) order by request.created_at desc),'[]'::jsonb) into v_support from public.platform_support_requests request join public.conferences conference on conference.id=request.conference_id join public.profiles profile on profile.id=request.requested_by;
  select coalesce(jsonb_agg(jsonb_build_object('id',feedback.id,'conferenceName',conference.name,'playerName',profile.display_name,'message',feedback.message,'createdAt',feedback.created_at) order by feedback.created_at desc),'[]'::jsonb) into v_feedback from public.platform_feedback feedback join public.conferences conference on conference.id=feedback.conference_id join public.profiles profile on profile.id=feedback.submitted_by;
  return jsonb_build_object('authorized',true,'owners',v_owners,'candidates',v_candidates,'directory',v_directory,'support',v_support,'feedback',v_feedback);
end;
$$;
revoke all on function public.submit_platform_feedback(uuid,text),public.platform_owner_operations() from public;
grant execute on function public.submit_platform_feedback(uuid,text),public.platform_owner_operations() to authenticated;
