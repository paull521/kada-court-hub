-- Captain workspace foundation: game availability, account-level partial payments,
-- captain payment visibility, and irreversible final scores.

alter table public.games add column if not exists finalized_at timestamptz;
alter table public.games add column if not exists finalized_by uuid references public.profiles(id);
update public.games set finalized_at=now() where finalized_at is null and home_score is not null and away_score is not null;

create table if not exists public.game_availability (
  game_id uuid not null references public.games(id) on delete cascade,
  registration_id uuid not null references public.registrations(id) on delete cascade,
  available boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key(game_id,registration_id)
);
alter table public.game_availability enable row level security;
grant select on public.game_availability to authenticated;
drop policy if exists "Team members and owners view availability" on public.game_availability;
create policy "Team members and owners view availability" on public.game_availability for select to authenticated using(
  exists(
    select 1 from public.registrations target
    join public.games game on game.id=game_availability.game_id
    join public.seasons season on season.id=game.season_id
    where target.id=game_availability.registration_id and(
      public.user_has_conference_role(season.conference_id,array['owner']::public.conference_role[])
      or exists(
        select 1 from public.registrations viewer
        join public.player_profiles player on player.id=viewer.player_id
        where player.profile_id=(select auth.uid()) and viewer.team_id=target.team_id
          and viewer.season_id=target.season_id
      )
    )
  )
);

create or replace function public.set_game_availability(p_game_id uuid,p_available boolean)
returns void language plpgsql security definer set search_path=''
as $$
declare v_registration_id uuid;v_finalized_at timestamptz;
begin
  select registration.id,game.finalized_at into v_registration_id,v_finalized_at
  from public.games game
  join public.registrations registration on registration.season_id=game.season_id and registration.team_id in(game.home_team_id,game.away_team_id)
  join public.player_profiles player on player.id=registration.player_id
  where game.id=p_game_id and player.profile_id=(select auth.uid()) and registration.status in('active','pending')
  limit 1;
  if v_registration_id is null then raise exception 'This game does not belong to your team.'; end if;
  if v_finalized_at is not null then raise exception 'Availability is locked because this game is final.'; end if;
  insert into public.game_availability(game_id,registration_id,available,updated_at)
  values(p_game_id,v_registration_id,p_available,now())
  on conflict(game_id,registration_id) do update set available=excluded.available,updated_at=now();
end;
$$;

create or replace function public.get_team_game_availability(p_game_id uuid)
returns table(registration_id uuid,player_name text,jersey_number integer,player_position text,role_label text,available boolean,responded boolean)
language plpgsql security definer set search_path=''
as $$
declare v_team_id uuid;v_season_id uuid;
begin
  select viewer.team_id,game.season_id into v_team_id,v_season_id
  from public.games game
  join public.registrations viewer on viewer.season_id=game.season_id and viewer.team_id in(game.home_team_id,game.away_team_id)
  join public.player_profiles player on player.id=viewer.player_id
  where game.id=p_game_id and player.profile_id=(select auth.uid())
  limit 1;
  if v_team_id is null then raise exception 'This game does not belong to your team.'; end if;
  return query
  select registration.id,player.display_name,registration.jersey_number,coalesce(registration.position,''),registration.role_label,coalesce(answer.available,true),answer.registration_id is not null
  from public.registrations registration
  join public.player_profiles player on player.id=registration.player_id
  left join public.game_availability answer on answer.game_id=p_game_id and answer.registration_id=registration.id
  where registration.season_id=v_season_id and registration.team_id=v_team_id and registration.status in('active','pending')
  order by case registration.role_label when 'Captain' then 0 when 'Co-captain' then 1 else 2 end,registration.jersey_number nulls last,player.display_name;
end;
$$;

alter table public.payment_submissions add column if not exists registration_id uuid references public.registrations(id) on delete cascade;
update public.payment_submissions submission set registration_id=fee.registration_id from public.fees fee where fee.id=submission.fee_id and submission.registration_id is null;
alter table public.payment_submissions alter column fee_id drop not null;
drop index if exists public.payment_submissions_one_pending_fee_idx;
create index if not exists payment_submissions_pending_registration_idx on public.payment_submissions(registration_id) where status='pending' and registration_id is not null;

alter table public.payments add column if not exists registration_id uuid references public.registrations(id) on delete cascade;
update public.payments payment set registration_id=fee.registration_id from public.fees fee where fee.id=payment.fee_id and payment.registration_id is null;
alter table public.payments alter column fee_id drop not null;

create table if not exists public.registration_waivers(
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations(id) on delete cascade,
  amount_cents integer not null check(amount_cents>0),
  reason text not null check(char_length(reason)<=500),
  approved_by uuid not null references public.profiles(id),
  approved_at timestamptz not null default now()
);
alter table public.registration_waivers enable row level security;
grant select on public.registration_waivers to authenticated;
drop policy if exists "Players owners and captains view registration waivers" on public.registration_waivers;
create policy "Players owners and captains view registration waivers" on public.registration_waivers for select to authenticated using(
  exists(
    select 1 from public.registrations registration
    join public.player_profiles player on player.id=registration.player_id
    join public.seasons season on season.id=registration.season_id
    where registration.id=registration_waivers.registration_id and(
      player.profile_id=(select auth.uid())
      or public.user_has_conference_role(season.conference_id,array['owner']::public.conference_role[])
      or exists(
        select 1 from public.registrations leader
        join public.player_profiles leader_player on leader_player.id=leader.player_id
        where leader.team_id=registration.team_id and leader_player.profile_id=(select auth.uid()) and leader.role_label in('Captain','Co-captain')
      )
    )
  )
);

drop policy if exists "Players and owners view payments" on public.payments;
create policy "Players owners and captains view payments" on public.payments for select to authenticated using(
  exists(
    select 1 from public.registrations registration
    join public.player_profiles player on player.id=registration.player_id
    join public.seasons season on season.id=registration.season_id
    where registration.id=coalesce(payments.registration_id,(select fee.registration_id from public.fees fee where fee.id=payments.fee_id)) and(
      player.profile_id=(select auth.uid())
      or public.user_has_conference_role(season.conference_id,array['owner']::public.conference_role[])
      or exists(
        select 1 from public.registrations leader
        join public.player_profiles leader_player on leader_player.id=leader.player_id
        where leader.team_id=registration.team_id and leader_player.profile_id=(select auth.uid()) and leader.role_label in('Captain','Co-captain')
      )
    )
  )
);

drop policy if exists "Players and owners view payment submissions" on public.payment_submissions;
create policy "Players owners and captains view payment submissions" on public.payment_submissions for select to authenticated using(
  exists(
    select 1 from public.registrations registration
    join public.player_profiles player on player.id=registration.player_id
    join public.seasons season on season.id=registration.season_id
    where registration.id=coalesce(payment_submissions.registration_id,(select fee.registration_id from public.fees fee where fee.id=payment_submissions.fee_id)) and(
      payment_submissions.profile_id=(select auth.uid())
      or public.user_has_conference_role(season.conference_id,array['owner']::public.conference_role[])
      or exists(
        select 1 from public.registrations leader
        join public.player_profiles leader_player on leader_player.id=leader.player_id
        where leader.team_id=registration.team_id and leader_player.profile_id=(select auth.uid()) and leader.role_label in('Captain','Co-captain')
      )
    )
  )
);

create or replace function public.player_submit_account_payment(p_registration_id uuid,p_amount_cents integer,p_method text,p_reference text default null)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_profile_id uuid;v_conference_id uuid;v_submission_id uuid;v_reference text:=nullif(trim(p_reference),'');v_charges integer;v_paid integer;v_waived integer;v_pending integer;
begin
  if p_method not in('zelle','cash','waiver') then raise exception 'Choose Zelle, cash, or waiver.'; end if;
  if p_amount_cents is null or p_amount_cents<1 then raise exception 'Enter how much you will pay.'; end if;
  if p_method='waiver' and v_reference is null then raise exception 'A comment is required for a waiver request.'; end if;
  if char_length(coalesce(v_reference,''))>200 then raise exception 'Enter a shorter comment or reference.'; end if;
  select player.profile_id,season.conference_id into v_profile_id,v_conference_id
  from public.registrations registration join public.player_profiles player on player.id=registration.player_id join public.seasons season on season.id=registration.season_id
  where registration.id=p_registration_id;
  if v_profile_id is null or v_profile_id<>(select auth.uid()) then raise exception 'This balance does not belong to the signed-in player.'; end if;
  select coalesce(sum(amount_cents),0) into v_charges from public.fees where registration_id=p_registration_id;
  select coalesce(sum(amount_cents),0) into v_paid from public.payments payment where coalesce(payment.registration_id,(select fee.registration_id from public.fees fee where fee.id=payment.fee_id))=p_registration_id;
  select coalesce(sum(amount_cents),0) into v_waived from public.registration_waivers where registration_id=p_registration_id;
  select coalesce(sum(amount_cents),0) into v_pending from public.payment_submissions where registration_id=p_registration_id and status='pending';
  if p_amount_cents>greatest(0,v_charges-v_paid-v_waived-v_pending) then raise exception 'The amount is greater than the remaining balance.'; end if;
  if exists(select 1 from public.payment_submissions where registration_id=p_registration_id and status='pending') then raise exception 'A payment or waiver request is already awaiting owner review.'; end if;
  insert into public.payment_submissions(registration_id,fee_id,profile_id,amount_cents,method,reference)
  values(p_registration_id,null,v_profile_id,p_amount_cents,p_method,v_reference) returning id into v_submission_id;
  insert into public.notifications(profile_id,notification_type,title,body,link_path,entity_id)
  select membership.profile_id,'payment_submitted',case when p_method='waiver' then 'Waiver request needs review' else 'Payment needs review' end,
    case when p_method='waiver' then 'A player requested a $'||to_char(p_amount_cents/100.0,'FM999999990.00')||' waiver.' else 'A player reported a $'||to_char(p_amount_cents/100.0,'FM999999990.00')||' payment.' end,
    '/owner/payments',v_submission_id
  from public.conference_memberships membership where membership.conference_id=v_conference_id and membership.role='owner';
  return v_submission_id;
end;
$$;

create or replace function public.owner_review_payment_notice(p_submission_id uuid,p_decision text,p_review_note text default null)
returns void language plpgsql security definer set search_path=''
as $$
declare v_conference_id uuid;v_profile_id uuid;v_registration_id uuid;v_amount_cents integer;v_method text;v_reference text;v_status text;v_note text:=nullif(trim(p_review_note),'');
begin
  if p_decision not in('confirmed','declined') then raise exception 'Choose Confirm or Decline.'; end if;
  if p_decision='declined' and v_note is null then raise exception 'Add a reason when declining a request.'; end if;
  if char_length(coalesce(v_note,''))>500 then raise exception 'Enter a shorter review note.'; end if;
  select season.conference_id,submission.profile_id,coalesce(submission.registration_id,fee.registration_id),submission.amount_cents,submission.method,submission.reference,submission.status
  into v_conference_id,v_profile_id,v_registration_id,v_amount_cents,v_method,v_reference,v_status
  from public.payment_submissions submission left join public.fees fee on fee.id=submission.fee_id join public.registrations registration on registration.id=coalesce(submission.registration_id,fee.registration_id) join public.seasons season on season.id=registration.season_id
  where submission.id=p_submission_id for update;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then raise exception 'Only the conference owner can review this request.'; end if;
  if v_status<>'pending' then raise exception 'This request was already reviewed.'; end if;
  update public.payment_submissions set status=p_decision,review_note=v_note,reviewed_by=(select auth.uid()),reviewed_at=now() where id=p_submission_id;
  if p_decision='confirmed' and v_method='waiver' then
    insert into public.registration_waivers(registration_id,amount_cents,reason,approved_by) values(v_registration_id,v_amount_cents,coalesce(v_reference,v_note,'Approved waiver'),(select auth.uid()));
  elsif p_decision='confirmed' then
    insert into public.payments(registration_id,fee_id,amount_cents,method,recorded_by,note) values(v_registration_id,null,v_amount_cents,v_method,(select auth.uid()),concat_ws(' · ',v_reference,v_note));
  end if;
  insert into public.notifications(profile_id,notification_type,title,body,link_path,entity_id)
  values(v_profile_id,'payment_reviewed',case when p_decision='confirmed' then case when v_method='waiver' then 'Waiver approved' else 'Payment confirmed' end else 'Payment needs attention' end,
    case when p_decision='confirmed' then '$'||to_char(v_amount_cents/100.0,'FM999999990.00')||case when v_method='waiver' then ' was waived.' else ' was confirmed.' end else coalesce(v_note,'The request was declined.') end,'/payments',p_submission_id)
  on conflict(profile_id,notification_type,entity_id) do update set title=excluded.title,body=excluded.body,link_path=excluded.link_path,read_at=null,created_at=now();
end;
$$;

create or replace function public.captain_team_payment_balances(p_team_id uuid)
returns table(registration_id uuid,player_name text,league_fee_cents bigint,uniform_fee_cents bigint,platform_fee_cents bigint,total_charges_cents bigint,paid_cents bigint,waived_cents bigint,pending_cents bigint,balance_cents bigint,payment_status text)
language plpgsql security definer set search_path=''
as $$
begin
  if not exists(select 1 from public.registrations leader join public.player_profiles player on player.id=leader.player_id where leader.team_id=p_team_id and player.profile_id=(select auth.uid()) and leader.role_label in('Captain','Co-captain')) then raise exception 'Captain access is required for this team.'; end if;
  return query
  select registration.id,player.display_name,
    coalesce((select sum(fee.amount_cents) from public.fees fee where fee.registration_id=registration.id and fee.category='league'),0)::bigint,
    coalesce((select sum(fee.amount_cents) from public.fees fee where fee.registration_id=registration.id and fee.category='uniform'),0)::bigint,
    coalesce((select sum(fee.amount_cents) from public.fees fee where fee.registration_id=registration.id and fee.category='platform'),0)::bigint,
    coalesce((select sum(fee.amount_cents) from public.fees fee where fee.registration_id=registration.id),0)::bigint,
    coalesce((select sum(payment.amount_cents) from public.payments payment where coalesce(payment.registration_id,(select fee.registration_id from public.fees fee where fee.id=payment.fee_id))=registration.id),0)::bigint,
    coalesce((select sum(waiver.amount_cents) from public.registration_waivers waiver where waiver.registration_id=registration.id),0)::bigint,
    coalesce((select sum(submission.amount_cents) from public.payment_submissions submission where submission.registration_id=registration.id and submission.status='pending'),0)::bigint,
    greatest(0,coalesce((select sum(fee.amount_cents) from public.fees fee where fee.registration_id=registration.id),0)-coalesce((select sum(payment.amount_cents) from public.payments payment where coalesce(payment.registration_id,(select fee.registration_id from public.fees fee where fee.id=payment.fee_id))=registration.id),0)-coalesce((select sum(waiver.amount_cents) from public.registration_waivers waiver where waiver.registration_id=registration.id),0))::bigint,
    case
      when coalesce((select sum(fee.amount_cents) from public.fees fee where fee.registration_id=registration.id),0)<=coalesce((select sum(payment.amount_cents) from public.payments payment where coalesce(payment.registration_id,(select fee.registration_id from public.fees fee where fee.id=payment.fee_id))=registration.id),0)+coalesce((select sum(waiver.amount_cents) from public.registration_waivers waiver where waiver.registration_id=registration.id),0) then case when coalesce((select sum(waiver.amount_cents) from public.registration_waivers waiver where waiver.registration_id=registration.id),0)>0 then 'Settled' else 'Paid' end
      when coalesce((select sum(payment.amount_cents) from public.payments payment where coalesce(payment.registration_id,(select fee.registration_id from public.fees fee where fee.id=payment.fee_id))=registration.id),0)>0 or coalesce((select sum(waiver.amount_cents) from public.registration_waivers waiver where waiver.registration_id=registration.id),0)>0 then 'Partial'
      else 'Not paid'
    end
  from public.registrations registration join public.player_profiles player on player.id=registration.player_id
  where registration.team_id=p_team_id and registration.status in('active','pending')
  order by player.display_name;
end;
$$;

create or replace function public.lock_final_game_changes()
returns trigger language plpgsql set search_path=''
as $$
begin
  if old.finalized_at is not null and new is distinct from old then raise exception 'This game is final and cannot be changed.'; end if;
  return new;
end;
$$;
drop trigger if exists lock_final_game_changes on public.games;
create trigger lock_final_game_changes before update on public.games for each row execute function public.lock_final_game_changes();

create or replace function public.owner_finalize_game_score(p_game_id uuid,p_home_score integer,p_away_score integer)
returns void language plpgsql security definer set search_path=''
as $$
declare v_conference_id uuid;v_home_team_id uuid;v_away_team_id uuid;
begin
  if p_home_score is null or p_away_score is null or p_home_score<0 or p_away_score<0 then raise exception 'Enter both valid final scores.'; end if;
  select season.conference_id,game.home_team_id,game.away_team_id into v_conference_id,v_home_team_id,v_away_team_id
  from public.games game join public.seasons season on season.id=game.season_id where game.id=p_game_id and game.finalized_at is null and game.status='scheduled';
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then raise exception 'Only the owner can finalize this scheduled game.'; end if;
  update public.games set home_score=p_home_score,away_score=p_away_score,finalized_at=now(),finalized_by=(select auth.uid()) where id=p_game_id;
  insert into public.notifications(profile_id,notification_type,title,body,link_path,entity_id)
  select distinct player.profile_id,'game_final','Final score posted',p_home_score||'–'||p_away_score||' is now final and locked.','/results',p_game_id
  from public.registrations registration join public.player_profiles player on player.id=registration.player_id where registration.team_id in(v_home_team_id,v_away_team_id) and player.profile_id is not null
  on conflict(profile_id,notification_type,entity_id) do update set title=excluded.title,body=excluded.body,link_path=excluded.link_path,read_at=null,created_at=now();
end;
$$;

revoke all on function public.set_game_availability(uuid,boolean) from public;
revoke all on function public.get_team_game_availability(uuid) from public;
revoke all on function public.player_submit_account_payment(uuid,integer,text,text) from public;
revoke all on function public.captain_team_payment_balances(uuid) from public;
revoke all on function public.owner_finalize_game_score(uuid,integer,integer) from public;
grant execute on function public.set_game_availability(uuid,boolean) to authenticated;
grant execute on function public.get_team_game_availability(uuid) to authenticated;
grant execute on function public.player_submit_account_payment(uuid,integer,text,text) to authenticated;
grant execute on function public.captain_team_payment_balances(uuid) to authenticated;
grant execute on function public.owner_finalize_game_score(uuid,integer,integer) to authenticated;
