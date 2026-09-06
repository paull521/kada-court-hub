# KCH Demo Conference Runbook

Use this guide when adding, verifying, or removing a KCH demonstration conference.

## Safety rules

- Work only from a reviewed migration in `supabase/migrations/`. Do not build demo records manually in the app.
- The user runs a reviewed migration in the Supabase SQL Editor unless they explicitly authorize a different method.
- Never reuse, edit, or delete an existing real conference, season, team, player, payment, or owner record.
- Use a unique permanent conference slug, demo-prefixed synthetic player IDs, and `example.invalid` contact details for fictional players.
- A real person can be associated with the demo, but their shared `profiles` and `player_profiles` records must never be deleted when the demo is removed.
- Before applying or removing a demo, inspect the target conference ID and counts. Do not use broad `UPDATE`, `DELETE`, `TRUNCATE`, or `DROP` statements.

## Existing examples

- `supabase/migrations/0095_wapinoy_fall_2026_demo.sql` — full owner/player/team/fee/schedule demo pattern.
- `supabase/migrations/0097_finalize_wapinoy_demo_schedules.sql` — schedule finalization pattern.
- `supabase/migrations/0098_import_wapinoy_40_over_rosters.sql` — additional demo roster and payment pattern.
- `supabase/migrations/0110_basketballeverydaywa_demo.sql` — BasketballeverydayWA / SH-Tally Ballers demo.

## Information to collect before creating a demo

1. Conference name and a unique lowercase slug.
2. Owner profile to associate, confirmed from the KCH database.
3. Season name, exact start/end dates, and whether the season is a free pilot.
4. Division names, venue, courts, teams, and schedule source.
5. Rosters: distinguish real profiles from fictional demo players. Do not invent a roster unless requested.
6. Player fees, what is paid versus due, and whether the owner should see a platform balance.
7. Whether games need scores/history or should remain scheduled only.

## Creation pattern

Create one numbered, idempotent migration. It should use a `do $$ ... $$` block and this dependency order:

1. Confirm the approved owner profile exists; create that person's `player_profiles` row only if it is missing.
2. Insert or retrieve the conference using its unique slug. Set `is_test=false` when the demo must be visible in the Platform workspace like a real conference.
3. Add owner and player `conference_memberships`, the `platform_owner_records` entry, and `conference_subscriptions` entry.
4. Insert the season and divisions, marking the season setup complete only when the demo includes its ready roster and schedule.
5. Insert teams and financial settings.
6. Insert only approved fictional `player_profiles` with globally unique demo IDs; then add them to `conference_player_pool`.
7. Create registrations, captain/co-captain roles, fees, and payment records. KCH records the obligation and the owner's recorded payment; it does not process money.
8. Insert games using the conference timezone, then finalize `division_schedule_workflows` if the demo needs to look live.
9. Add a single scoped activity-log entry.

Use `on conflict`, `not exists`, or a migration-specific note/key for rerun safety. Scope every lookup through the new conference, season, or division ID.

### Pricing rule

The current owner price model is $50 per season plus $3 per active player registration. The first regular season is a complimentary pilot unless explicitly marked otherwise by existing pricing rules. Do not insert a made-up owner charge for a free demo. Player league and uniform fees remain the conference owner's records.

## Verification query checklist

Run these as read-only, conference-scoped checks in the SQL Editor after applying a migration. Replace only `YOUR-DEMO-SLUG`.

```sql
select c.name, c.slug, s.name as season, d.name as division,
       count(distinct t.id) as teams,
       count(distinct r.id) as registrations,
       count(distinct g.id) as games
from public.conferences c
left join public.seasons s on s.conference_id = c.id
left join public.divisions d on d.season_id = s.id
left join public.teams t on t.division_id = d.id
left join public.registrations r on r.season_id = s.id and r.division_id = d.id
left join public.games g on g.season_id = s.id
where c.slug = 'YOUR-DEMO-SLUG'
group by c.name, c.slug, s.name, d.name;
```

```sql
select fee.category, fee.status, count(*) as fee_count, sum(fee.amount_cents) as cents
from public.fees fee
join public.registrations registration on registration.id = fee.registration_id
join public.seasons season on season.id = registration.season_id
join public.conferences conference on conference.id = season.conference_id
where conference.slug = 'YOUR-DEMO-SLUG'
group by fee.category, fee.status
order by fee.category, fee.status;
```

Then test the app with the intended profile:

- Player Home and Profile show the selected conference, team, and balance.
- Captain view shows only that team roster and schedule.
- Owner view shows the division, teams, player directory, payments, and schedule.
- Platform Owners shows the conference and owner record.

## Removing one demo safely

Removal is destructive and must be handled as a new, reviewed rollback migration. Never delete by name alone and never delete a shared real profile. Confirm the exact slug and conference ID immediately before running it.

### Required removal sequence

1. Capture a read-only inventory of the demo's conference ID, seasons, registrations, games, payments, fees, rules documents, and synthetic player IDs.
2. Start a transaction and retrieve the conference using the exact slug. Raise an exception if it is missing or is not the expected demo.
3. Delete dependent payment rows for registrations in that conference before deleting fees. Payment foreign keys can otherwise prevent removal.
4. Delete rules acknowledgments and draft-only rules documents for the conference before deleting seasons. Published or acknowledged rules require explicit review because KCH normally preserves that history.
5. Delete the demo's `platform_owner_records` row by exact `conference_id`; this preserves the real owner's account and any other conferences.
6. Delete the exact conference row. Its cascade relationships remove memberships, seasons, divisions, teams, registrations, games, fees, schedule workflow, player-pool entries, activity logs, subscriptions, support, feedback, and owner ledger records that are scoped to the conference.
7. Delete only the synthetic demo `player_profiles` whose public IDs were created by that demo migration and which have no remaining registration or conference-pool references. Never delete a player with a real KCH profile association.
8. Commit, run the inventory again, and confirm no records remain for the exact slug.

### Removal guardrails

- Do not delete the real owner's `profiles` or `player_profiles` row.
- Do not delete global data merely because a display name matches a demo player.
- Do not delete other conferences, even if they share the same owner.
- Do not remove a migration file from repository history after it has been applied. Create a later rollback migration instead.
- If a demo has real registrations, acknowledged rules, finalized scores, or user-entered data, stop and obtain explicit deletion approval before writing the rollback migration.

## Current known demos

| Conference | Migration/reference | Notes |
| --- | --- | --- |
| WAPinoy - Pilot Season | `0095` through `0102` | Multiple divisions and roster follow-up migrations. |
| KCH Pilot - AAPBA test | Supabase SQL Editor history | Created as a prior pilot demo; confirm its exact records before any removal. |
| BasketballeverydayWA | `0110_basketballeverydaywa_demo.sql` | Summer 2026, Division X 2026, SH-Tally Ballers roster. |

## Before handing off

- Record the migration number and whether the user has run it in Supabase.
- State the exact conference slug, owner profile used, roster count, team count, game count, and fee setup.
- Keep this runbook current when schema or owner pricing rules change.
