-- Keep owner-entered scores as a draft until Final Score is selected.
alter table public.games add column if not exists draft_home_score integer;
alter table public.games add column if not exists draft_away_score integer;
alter table public.games add column if not exists score_draft_updated_at timestamptz;
alter table public.games add column if not exists score_draft_updated_by uuid references auth.users(id);

alter table public.games drop constraint if exists games_draft_scores_valid;
alter table public.games add constraint games_draft_scores_valid check (
  (draft_home_score is null and draft_away_score is null)
  or (draft_home_score >= 0 and draft_away_score >= 0)
);

create or replace function public.owner_save_game_score_draft(p_game_id uuid,p_home_score integer,p_away_score integer)
returns void language plpgsql security definer set search_path='' as $$
declare v_conference_id uuid;
begin
  if p_home_score is null or p_away_score is null or p_home_score<0 or p_away_score<0 then raise exception 'Enter both valid draft scores.'; end if;
  select season.conference_id into v_conference_id
  from public.games game join public.seasons season on season.id=game.season_id
  where game.id=p_game_id and game.finalized_at is null and game.status='scheduled';
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then raise exception 'Only the owner can save scores for this scheduled game.'; end if;
  update public.games set draft_home_score=p_home_score,draft_away_score=p_away_score,score_draft_updated_at=now(),score_draft_updated_by=(select auth.uid()) where id=p_game_id;
end;
$$;

create or replace function public.owner_finalize_game_score(p_game_id uuid,p_home_score integer,p_away_score integer)
returns void language plpgsql security definer set search_path='' as $$
declare v_conference_id uuid;v_home_team_id uuid;v_away_team_id uuid;
begin
  if p_home_score is null or p_away_score is null or p_home_score<0 or p_away_score<0 then raise exception 'Enter both valid final scores.'; end if;
  select season.conference_id,game.home_team_id,game.away_team_id into v_conference_id,v_home_team_id,v_away_team_id
  from public.games game join public.seasons season on season.id=game.season_id
  where game.id=p_game_id and game.finalized_at is null and game.status='scheduled';
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then raise exception 'Only the owner can finalize this scheduled game.'; end if;
  update public.games set home_score=p_home_score,away_score=p_away_score,draft_home_score=null,draft_away_score=null,score_draft_updated_at=null,score_draft_updated_by=null,finalized_at=now(),finalized_by=(select auth.uid()) where id=p_game_id;
  insert into public.notifications(profile_id,notification_type,title,body,link_path,entity_id)
  select distinct player.profile_id,'game_final','Final score posted',p_home_score||'–'||p_away_score||' is final.','/results',p_game_id
  from public.registrations registration join public.player_profiles player on player.id=registration.player_id where registration.team_id in(v_home_team_id,v_away_team_id) and player.profile_id is not null
  on conflict(profile_id,notification_type,entity_id) do update set title=excluded.title,body=excluded.body,link_path=excluded.link_path,read_at=null,created_at=now();
end;
$$;

revoke all on function public.owner_save_game_score_draft(uuid,integer,integer) from public;
grant execute on function public.owner_save_game_score_draft(uuid,integer,integer) to authenticated;
