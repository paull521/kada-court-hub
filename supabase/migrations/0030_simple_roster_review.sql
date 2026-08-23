-- Simplified team review: owner can approve or request changes without a note.

create or replace function public.owner_review_team_roster(p_team_id uuid,p_decision text,p_owner_note text default null)
returns void language plpgsql security definer set search_path=''
as $$
declare v_conference_id uuid;v_status text;
begin
  if p_decision not in ('approved','changes_requested') then raise exception 'Choose Approve or Request Changes.'; end if;
  select season.conference_id,draft.status into v_conference_id,v_status
  from public.teams team
  join public.divisions division on division.id=team.division_id
  join public.seasons season on season.id=division.season_id
  left join public.team_roster_drafts draft on draft.team_id=team.id
  where team.id=p_team_id;
  if v_conference_id is null or not public.user_has_conference_role(v_conference_id,array['owner']::public.conference_role[]) then raise exception 'Only the conference owner can review this roster.'; end if;
  if v_status<>'submitted' then raise exception 'The captain must submit this roster first.'; end if;
  update public.team_roster_drafts
  set status=p_decision,owner_note=null,reviewed_at=now(),reviewed_by=(select auth.uid()),updated_at=now()
  where team_id=p_team_id;
end;
$$;

revoke all on function public.owner_review_team_roster(uuid,text,text) from public;
grant execute on function public.owner_review_team_roster(uuid,text,text) to authenticated;

