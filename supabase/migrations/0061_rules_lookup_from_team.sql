create or replace function public.get_required_rule_acknowledgment()
returns table(rules_document_id uuid,conference_name text,season_name text,division_name text,title text,version text,effective_date date,content text,acknowledged_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare v_player_id uuid;v_conference_id uuid;v_season_id uuid;v_division_id uuid;v_document public.rules_documents;
begin
  select player.id,season.conference_id,season.id,team.division_id
  into v_player_id,v_conference_id,v_season_id,v_division_id
  from public.player_profiles player
  join public.registrations registration on registration.player_id=player.id
  join public.teams team on team.id=registration.team_id
  join public.seasons season on season.id=registration.season_id
  where player.profile_id=(select auth.uid())
    and season.canceled_at is null
  order by season.starts_on desc,registration.created_at desc
  limit 1;
  if v_player_id is null then return; end if;
  select * into v_document from public.ensure_default_season_rules(v_conference_id,v_season_id);
  if exists(select 1 from public.player_rule_acknowledgments where player_id=v_player_id and rules_document_id=v_document.id) then return; end if;
  return query
  select v_document.id,conference.name,season.name,division.name,v_document.title,v_document.version,v_document.effective_date,v_document.content,null::timestamptz
  from public.seasons season
  join public.conferences conference on conference.id=season.conference_id
  join public.divisions division on division.id=v_division_id
  where season.id=v_season_id;
end;
$$;
