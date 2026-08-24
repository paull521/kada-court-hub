-- Demo mode: conference owners may finalize a scheduled game before tip-off.
create or replace function public.owner_finalize_game_score(p_game_id uuid,p_home_score integer,p_away_score integer)
returns void language plpgsql security definer set search_path='' as $$
declare v_conference_id uuid;
begin
  if p_home_score is null or p_away_score is null or p_home_score<0 or p_away_score<0 then raise exception 'Enter both valid final scores.'; end if;
  select season.conference_id into v_conference_id from public.games game join public.seasons season on season.id=game.season_id where game.id=p_game_id and game.finalized_at is null and game.status='scheduled';
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then raise exception 'Only the owner can finalize this scheduled game.'; end if;
  update public.games set home_score=p_home_score,away_score=p_away_score,finalized_at=now(),finalized_by=(select auth.uid()) where id=p_game_id;
end;
$$;
