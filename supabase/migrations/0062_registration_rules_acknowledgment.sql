create or replace function public.get_registration_rules(p_registration_id uuid)
returns table(rules_document_id uuid,conference_name text,season_name text,division_name text,title text,version text,effective_date date,content text,acknowledged_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare v_player_id uuid;v_conference_id uuid;v_season_id uuid;v_division_id uuid;v_document public.rules_documents;
begin
  select player.id,season.conference_id,season.id,team.division_id
  into v_player_id,v_conference_id,v_season_id,v_division_id
  from public.registrations registration
  join public.player_profiles player on player.id=registration.player_id
  join public.teams team on team.id=registration.team_id
  join public.seasons season on season.id=registration.season_id
  where registration.id=p_registration_id and player.profile_id=(select auth.uid());
  if v_player_id is null then return; end if;
  select * into v_document from public.ensure_default_season_rules(v_conference_id,v_season_id);
  return query
  select v_document.id,conference.name,season.name,division.name,v_document.title,v_document.version,v_document.effective_date,v_document.content,ack.acknowledged_at
  from public.seasons season
  join public.conferences conference on conference.id=season.conference_id
  join public.divisions division on division.id=v_division_id
  left join public.player_rule_acknowledgments ack on ack.player_id=v_player_id and ack.rules_document_id=v_document.id
  where season.id=v_season_id;
end;
$$;

create or replace function public.acknowledge_registration_rules(p_registration_id uuid,p_rules_document_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_player_id uuid;v_conference_id uuid;v_season_id uuid;v_document public.rules_documents;
begin
  select player.id,season.conference_id,season.id
  into v_player_id,v_conference_id,v_season_id
  from public.registrations registration
  join public.player_profiles player on player.id=registration.player_id
  join public.seasons season on season.id=registration.season_id
  where registration.id=p_registration_id and player.profile_id=(select auth.uid());
  select * into v_document from public.rules_documents where id=p_rules_document_id and conference_id=v_conference_id and season_id=v_season_id and status='published';
  if v_player_id is null or v_document.id is null then raise exception 'These rules are not available for your team.'; end if;
  insert into public.player_rule_acknowledgments(player_id,conference_id,season_id,rules_document_id,rules_version,status)
  values(v_player_id,v_conference_id,v_season_id,v_document.id,v_document.version,'acknowledged')
  on conflict(player_id,rules_document_id) do nothing;
end;
$$;

grant execute on function public.get_registration_rules(uuid) to authenticated;
grant execute on function public.acknowledge_registration_rules(uuid,uuid) to authenticated;
