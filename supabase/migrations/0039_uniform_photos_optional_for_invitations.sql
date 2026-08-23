-- Fees must be saved before invitations are sent. Uniform photos may be added
-- later and must not stop a division from progressing through preseason setup.

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
    where division.season_id=p_season_id and financial.division_id is null
  ) then raise exception 'Save fees for every division before sending invitations.'; end if;

  update public.seasons set preseason_ready=true where id=p_season_id;
  insert into public.activity_log (conference_id,actor_profile_id,action,entity_type,entity_id,summary)
  values (v_conference_id,(select auth.uid()),'complete','season_preseason',p_season_id::text,'Locked preseason fees; uniform photos remain optional');
end;
$$;
