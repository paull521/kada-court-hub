# KadaCourtHub (KCH) Development Handoff

Updated: August 20, 2026

## Start here

This is a working mobile-first Next.js and Supabase application for managing recreational basketball conferences. Continue from the existing code; do not rebuild the app from scratch.

Workspace:

`/Users/pdl521/.codex/.chatgpt-projects/g-p-6a7b615dbb888191aa7ea1bad708653e/kch-app`

Local URL:

`http://127.0.0.1:3001`

Run locally:

```bash
npm run dev -- --port 3001
```

Validate before handing changes back:

```bash
npm run build
```

The latest full production build passed. A new task may need to restart the local server.

## Product hierarchy

The approved hierarchy is:

1. KCH administrator creates a conference.
2. A conference owner creates seasons within that conference.
3. Each season contains one or more divisions.
4. Each division has its own teams, captains, invitations, draft roster, final roster, fees, uniforms, and schedule.
5. Starting at player invitations, divisions move independently. One division must never wait for another division to complete.

Current test conference: **KCH Basketball League**.

## Primary design principles

- Mobile-first and comfortable on a normal phone.
- Avoid crowded screens, tiny text, long pages, and repeated dropdowns.
- Prefer square task tiles, collapsible groups, short labels, and clear status colors.
- Make the workflow understandable without lengthy instructions.
- Preserve the approved KCH visual style: warm white background, navy, gold, subtle red, rounded cards.
- Test data is temporary and must not be treated as real league data.

## Roles and switching

One authenticated account can have any combination of:

- Player
- Captain or co-captain
- Conference owner

Captains and co-captains are also rostered players; captain is a designation, not a separate person type.

A shared **View As** switcher now appears when an account has multiple eligible roles. It is implemented in:

- `components/RoleSwitcher.tsx`
- `lib/roles.ts`
- Player Profile
- Captain More
- Owner More

Only roles actually assigned to the signed-in account should appear.

## Owner workflow

The guided season flow is:

1. Create Season
2. Add Divisions
3. Add Teams
4. Assign Captains and Co-captains
5. Fees & Uniforms
6. Invite Players
7. Draft Rosters
8. Build Schedule

Important rules:

- A season is canceled, not deleted, after it becomes operational.
- Existing seasons may receive another division later.
- Maximum division count in the setup UI is 10.
- Team count defaults to 8.
- Fees and dark/light uniform photos belong to a season/division.
- The separate owner Uniform menu was removed. Uniform changes remain under Season Setup.
- Invitation messages and optional flyers are sent separately per division.
- The owner chooses the invitation response deadline.
- Draft and final roster publication happen separately per division.
- Players may play in more than one division and pay separately for each registration.
- Referee assignment is flexible and must never block schedule creation.

Owner bottom navigation:

- Home
- Season
- Schedule
- Scores
- More

Owner Home is task-oriented with tiles rather than a dense management page.

## Rosters

- Captains and co-captains count toward the team player total.
- Captains enter or correct player jersey number, position, and other roster details.
- Captain roster submissions go through a repeated cycle: editing → submitted → owner approval or changes requested → captain revision → resubmission.
- The owner reviews each team separately using collapsible team cards.
- Team statuses use clear colors: Pending approval, Approved, Changes requested.
- All teams in one division must be approved before that division’s roster can be shared.
- A draft roster review has its own deadline.
- During review, players can view assignments for every team in their division.
- Requests during the review period are handled outside KCH through captains/owners.
- The owner publishes a Final Roster per division after review.
- Once final, the captain Team page is the permanent roster view.

Key files:

- `components/OwnerManagement.tsx`
- `components/CaptainDraftRoster.tsx`
- `components/CaptainRequestForm.tsx`
- `app/captain/actions.ts`
- Migrations `0026` through `0034`

## Scheduling

Step 8 offers two side-by-side choices per division:

- **Manual**: the owner enters date, time, venue, court, teams, and game duration.
- **Automate**: KCH creates a draft from dates/days played, court count, minutes per game, and games per day.

Rules:

- Both methods create a draft.
- All review, editing, and finalization happen on the owner Schedule page.
- By default, a team plays no more than once per day.
- The owner may override the generated schedule.
- Playoff schedules are added only after round-robin play is completed.
- Weekly all-team schedules are viewable by owners, players, and captains.
- Schedules are division-specific.

Relevant migrations:

- `0035_division_schedule_workflow.sql`
- `0036_one_game_per_team_per_day.sql`

## Final scores and game locking

The owner Scores page uses a controlled two-stage action:

1. Review Final Score
2. Final Score

After **Final Score** is pressed:

- The score is permanent.
- The game schedule, teams, venue, court, and availability are locked.
- There is intentionally no correction workflow in the current specification.
- Existing scored games are backfilled as finalized by migration `0037`.

Key files:

- `components/OwnerScoresheets.tsx`
- `app/owner/actions.ts`
- `supabase/migrations/0037_captain_workspace_foundation.sql`

## Player experience

Player bottom navigation:

- Home
- Team
- Schedule
- Payments
- Profile

Implemented behavior:

- A small context selector appears only when the player has multiple active registrations/divisions.
- Player Home shows the next game, jersey color, and Yes/No availability.
- Availability defaults to Yes when the player has not responded.
- A player may change availability until the owner enters the Final Score.
- Every teammate sees availability status.
- The Team navigation icon is green when everyone is available and red when anyone is unavailable.
- Team roster rows show green/red availability dots.
- Schedule includes the player’s upcoming games and a collapsible weekly all-team view.
- Uniform photos and color come from the season/division configuration.

Key files:

- `lib/kch-data.ts`
- `components/AppShell.tsx`
- `components/AvailabilityControl.tsx`
- `app/home/page.tsx`
- `app/my-team/page.tsx`
- `app/schedule/page.tsx`

## Captain workspace

The captain experience is part of the same account and appears only after an account is designated Captain or Co-captain.

Captain bottom navigation:

- Dashboard
- Team
- Schedule
- Payments
- More

Captain Dashboard has five task tiles:

- Roster
- Team
- Schedule
- Availability
- Payments

There is no Captain Uniform or Announcements tile.

Captain pages:

- `/captain` — dashboard
- `/captain/roster` — editable draft roster and ongoing change requests
- `/captain/team` — final roster and availability
- `/captain/schedule` — team schedule plus weekly all-team view
- `/captain/availability` — read-only team availability for the next game
- `/captain/payments` — read-only individual player balances
- `/captain/more` — role switching and account links

Captain payment visibility intentionally excludes any team-wide financial total. Captains see individual player balances only. Owners alone see all-player totals.

Key files:

- `lib/captain-data.ts`
- `components/CaptainShell.tsx`
- `components/CaptainContextSwitcher.tsx`
- `app/captain/**`
- `app/workspaces.css`

## Payments

Fees belong to a registration within one season/division.

Current player payment behavior:

- Players do not choose which fee they are paying.
- They enter **How much will you pay?**
- They choose Zelle, Cash, or Waiver.
- Partial payments are allowed.
- A waiver requires a mandatory comment.
- The player’s balance changes only after owner confirmation.
- Only one account-level payment or waiver request may await review at a time.
- Payment history is collapsible and shows up to 10 transactions.

Captain payment behavior:

- Passive/read-only.
- Shows each player’s charges, paid amount, waived amount, remaining balance, and pending review amount.
- No overall team balance or total is shown.

Owner payment behavior:

- Tracks each season/division separately.
- Shows Paid, Not Paid, and Waived.
- Shows Zelle and Cash counts/amounts.
- Owner reviews and confirms or declines player notices.
- Owner has financial summaries for season income, expenses, and profit/loss.

Key files:

- `components/PlayerPaymentForm.tsx`
- `app/payments/actions.ts`
- `app/payments/page.tsx`
- `lib/owner-data.ts`
- `app/owner/payments/page.tsx`
- Migration `0037`

## Database state

Supabase project reference:

`ehkxdcjsyopihpbqeqnq`

Do not place credentials or private keys in handoff notes or source control.

Migrations through the following file were manually run successfully in the Supabase SQL Editor:

`supabase/migrations/0037_captain_workspace_foundation.sql`

Migration `0037` provides:

- Per-game availability
- Team availability visibility
- Account-level partial payments and waivers
- Captain read-only payment visibility
- Multiple-role support used by the UI
- Owner Final Score RPC and irreversible game locking

The application expects migration `0037` to be installed. If a page reports a missing function, first confirm the migration was run in the correct Supabase project.

## Current verification status

- The user confirmed migration `0037` ran successfully.
- `npm run build` passed after the captain implementation.
- The local server was restarted and returned HTTP 200 on `/login`.
- The next task should visually test the captain workflow with a real designated captain login.

## Recommended next test

1. Start the local app on port 3001.
2. Sign in using an account assigned Captain or Co-captain.
3. Open Player Profile and verify **View As → Captain** appears.
4. Check the five Captain Dashboard tiles on a phone-sized viewport.
5. Test roster editing and submission.
6. Test player Yes/No availability and confirm the captain and team views update.
7. Test a partial Zelle or Cash notice, then confirm it on the owner Payments page.
8. Enter a test score, review it, press Final Score, and verify schedule/availability edits are rejected afterward.
9. Test an account that is both Owner and Captain and confirm all three role options appear.

## Known follow-up areas

- Complete end-to-end visual testing of every captain page on phone and desktop.
- Refine spacing and typography after functional testing; preserve the uncrowded design requirement.
- Test RLS policies with Player, Captain, Co-captain, and Owner accounts.
- Decide later whether referees need a dedicated workspace; referee registration and multi-game visibility were discussed but are not part of the completed captain implementation.
- Add broader scenarios only after the main Owner → Captain → Player workflow is stable.

## Instruction for the next coding model

Read this handoff and inspect the referenced files before changing code. Preserve existing working owner and player behavior. Do not make broad database changes without checking the existing migrations. Continue step-by-step, let the user verify each page, and keep every interface mobile-friendly.
