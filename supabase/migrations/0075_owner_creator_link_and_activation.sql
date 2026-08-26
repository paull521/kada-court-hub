-- The Platform Creator shares one owner-application link.  An applicant first
-- signs in to KCH and signs the agreement; the Creator then creates the
-- conference and activates owner access.
create or replace function public.platform_register_owner_applicant()
returns uuid language plpgsql security definer set search_path='' as $$
declare v_profile public.profiles%rowtype; v_email text; v_owner_id uuid;
begin
  if (select auth.uid()) is null then raise exception 'Sign in to your KCH account first.'; end if;
  select * into v_profile from public.profiles where id=(select auth.uid());
  v_email:=lower(coalesce(auth.jwt()->>'email',''));
  if v_profile.id is null or v_email='' then raise exception 'Your KCH profile could not be found.'; end if;
  select id into v_owner_id from public.platform_owner_records where profile_id=(select auth.uid()) or lower(email)=v_email limit 1;
  if v_owner_id is null then
    insert into public.platform_owner_records(full_name,email,phone,profile_id,status)
    values(v_profile.display_name,v_email,coalesce(v_profile.mobile,''),(select auth.uid()),'invited') returning id into v_owner_id;
  else
    update public.platform_owner_records set full_name=v_profile.display_name,email=v_email,phone=coalesce(v_profile.mobile,''),profile_id=(select auth.uid()),updated_at=now() where id=v_owner_id;
  end if;
  return v_owner_id;
end;
$$;

create or replace function public.sign_owner_application_contract(p_owner_id uuid,p_signed_name text)
returns void language plpgsql security definer set search_path='' as $$
begin
  if char_length(trim(p_signed_name))<2 then raise exception 'Type your full name.'; end if;
  if not exists(select 1 from public.platform_owner_records where id=p_owner_id and profile_id=(select auth.uid())) then raise exception 'This owner application is not available.'; end if;
  insert into public.platform_owner_contract_acknowledgments(owner_record_id,profile_id,signed_name)
  values(p_owner_id,(select auth.uid()),trim(p_signed_name))
  on conflict(owner_record_id) do update set profile_id=excluded.profile_id,signed_name=excluded.signed_name,signed_at=now();
end;
$$;

create or replace function public.platform_create_owner_conference(p_owner_id uuid,p_conference_name text)
returns void language plpgsql security definer set search_path='' as $$
declare r public.platform_owner_records%rowtype; v_conference_id uuid; v_slug text;
begin
  if not public.is_platform_creator() then raise exception 'Platform Creator access is required.'; end if;
  if char_length(trim(p_conference_name)) not between 2 and 80 then raise exception 'Enter a conference name.'; end if;
  select * into r from public.platform_owner_records where id=p_owner_id for update;
  if r.id is null or r.profile_id is null then raise exception 'The owner must complete KCH login first.'; end if;
  if r.conference_id is not null then raise exception 'This owner already has a conference.'; end if;
  if not exists(select 1 from public.platform_owner_contract_acknowledgments where owner_record_id=r.id) then raise exception 'The owner must complete the digital contract first.'; end if;
  v_slug:=lower(regexp_replace(trim(p_conference_name),'[^a-zA-Z0-9]+','-','g'))||'-'||substr(replace(gen_random_uuid()::text,'-',''),1,8);
  insert into public.conferences(name,slug) values(trim(p_conference_name),v_slug) returning id into v_conference_id;
  insert into public.conference_subscriptions(conference_id,status,due_on) values(v_conference_id,'due',date_trunc('month',current_date)::date);
  insert into public.conference_memberships(conference_id,profile_id,role) values(v_conference_id,r.profile_id,'owner') on conflict do nothing;
  update public.platform_owner_records set conference_id=v_conference_id,status='active',subscription_starts_on=current_date,subscription_ends_on=(current_date + interval '1 month')::date,updated_at=now() where id=r.id;
end;
$$;

create or replace function public.platform_owner_operations()
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_owners jsonb;v_candidates jsonb;v_directory jsonb;v_support jsonb;
begin
  if not public.is_platform_creator() then return jsonb_build_object('authorized',false); end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',record.id,'conferenceId',record.conference_id,'conferenceName',conference.name,'name',record.full_name,'email',record.email,'phone',record.phone,'status',record.status,'subscriptionStartsOn',record.subscription_starts_on,'subscriptionEndsOn',record.subscription_ends_on) order by record.created_at desc),'[]'::jsonb) into v_owners from public.platform_owner_records record join public.conferences conference on conference.id=record.conference_id;
  select coalesce(jsonb_agg(jsonb_build_object('id',record.id,'name',record.full_name,'email',record.email,'phone',record.phone,'contractSignedAt',ack.signed_at) order by ack.signed_at desc),'[]'::jsonb) into v_candidates from public.platform_owner_records record join public.platform_owner_contract_acknowledgments ack on ack.owner_record_id=record.id where record.conference_id is null;
  select coalesce(jsonb_agg(jsonb_build_object('conference',conference.name,'activeDivisions',active_divisions.count,'inactiveDivisions',inactive_divisions.count,'activePlayers',active_players.count,'inactivePlayers',inactive_players.count) order by conference.name),'[]'::jsonb) into v_directory from public.conferences conference left join lateral(select count(*) from public.divisions division join public.seasons season on season.id=division.season_id where season.conference_id=conference.id and season.canceled_at is null and season.ends_on>=current_date) active_divisions(count) on true left join lateral(select count(*) from public.divisions division join public.seasons season on season.id=division.season_id where season.conference_id=conference.id and(season.canceled_at is not null or season.ends_on<current_date)) inactive_divisions(count) on true left join lateral(select count(distinct registration.player_id) from public.registrations registration join public.seasons season on season.id=registration.season_id where season.conference_id=conference.id and registration.status='active' and season.canceled_at is null and season.starts_on<=current_date and season.ends_on>=current_date) active_players(count) on true left join lateral(select count(distinct registration.player_id) from public.registrations registration join public.seasons season on season.id=registration.season_id where season.conference_id=conference.id and (registration.status<>'active' or season.canceled_at is not null or season.ends_on<current_date)) inactive_players(count) on true where coalesce(conference.is_test,false)=false;
  select coalesce(jsonb_agg(jsonb_build_object('id',request.id,'conferenceName',conference.name,'ownerName',profile.display_name,'subject',request.subject,'message',request.message,'status',request.status,'createdAt',request.created_at) order by request.created_at desc),'[]'::jsonb) into v_support from public.platform_support_requests request join public.conferences conference on conference.id=request.conference_id join public.profiles profile on profile.id=request.requested_by;
  return jsonb_build_object('authorized',true,'owners',v_owners,'candidates',v_candidates,'directory',v_directory,'support',v_support);
end;
$$;

revoke all on function public.platform_register_owner_applicant(),public.sign_owner_application_contract(uuid,text),public.platform_create_owner_conference(uuid,text),public.platform_owner_operations() from public;
grant execute on function public.platform_register_owner_applicant(),public.sign_owner_application_contract(uuid,text),public.platform_create_owner_conference(uuid,text),public.platform_owner_operations() to authenticated;
