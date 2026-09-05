# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: the player.** Roughly 77 people across two divisions in the current
season. They open KCH to answer a short list of questions — when is my next
game, where, which jersey, am I marked as playing, what do I still owe — and
close it again. Most of that happens on a phone, often shortly before a game.

Three further roles exist in the product, each held by a person who is also a
player:

- **Captain / co-captain.** A designation on a rostered player, not a separate
  person. Enters and corrects jersey numbers, positions and roster details,
  submits the team roster for owner review, and revises it when changes are
  requested. Sees individual player balances but never a team total.
- **Conference owner.** Runs the league: creates seasons and divisions, assigns
  captains, sets fees and uniforms, invites players, publishes rosters, builds
  the schedule, enters final scores, and confirms payments.
- **Platform administrator.** Creates conferences and invites conference owners.
  A KCH-side role, not a league-side one.

One authenticated account can hold any combination of these, and a shared
**View As** switcher appears when it does.

## Product Purpose

KCH runs a recreational basketball conference end to end: seasons, divisions,
teams, rosters, invitations, fees, uniforms, availability, schedules and final
scores.

Success is a season that runs without anyone maintaining a spreadsheet or
scrolling a group chat to find out where they are playing.

## Positioning

KCH replaces a pile of tools nobody chose: a group chat for announcements, a
shared spreadsheet for the roster, and payment screenshots for money. Those
tools were never designed to work together, so the league's real state lives in
whichever one a person happened to read last.

The mechanism a neighboring product could not truthfully copy is that KCH is
shaped around how these specific leagues actually run, rather than around a
generic league model:

- **Divisions move independently.** From player invitations onward, one division
  never waits for another to finish.
- **Captains are players.** Leadership is a designation on a roster row, not a
  separate account type, so captains count toward team totals and appear on the
  roster like anyone else.
- **Money is collected the way it already was.** Zelle, cash, or a waiver with a
  mandatory comment — recorded and confirmed by the owner rather than processed.
- **Availability is public to the team.** Everyone sees who is in, because that
  is the question the group chat existed to answer.

## Operating Context

**Hierarchy.** Platform administrator creates a conference → conference owner
creates seasons within it → each season contains one or more divisions → each
division owns its teams, captains, invitations, draft roster, final roster,
fees, uniforms and schedule.

**The owner's season, in order.** Create season → add divisions → add teams →
assign captains and co-captains → fees and uniforms → invite players → draft
rosters → build schedule. A season is canceled rather than deleted once
operational. Existing seasons can receive another division later.

**The roster cycle.** Captain edits → submits → owner approves or requests
changes → captain revises → resubmits. Every team in a division must be approved
before that division's roster can be shared. The owner publishes a final roster
per division; after that the captain's Team page is the permanent roster view.

**Game day.** The player's home screen shows the next game, jersey color, and a
Yes/No availability control that defaults to Yes. Availability stays editable
until the owner enters the final score. Teammates see each other's status.

**Money.** Fees belong to a registration within one season and division. Players
do not choose which fee they are paying — they enter an amount and a method.
Partial payments are allowed. Balances change only after the owner confirms. One
account-level payment or waiver request may await review at a time.

**Scores are one-way.** After the owner presses Final Score the result is
permanent and the game's schedule, teams, venue, court and availability lock.
There is deliberately no correction workflow.

## Capabilities and Constraints

- **Invitation-only accounts.** A database trigger on `auth.users` rejects any
  new profile without a valid conference or platform-owner invitation token.
  This blocks the app's sign-up form, the Supabase dashboard, and the Admin API
  alike — so a freshly migrated project has no way to create its first account.
- **Row-level security is the access boundary**, not application checks. Reads
  return empty rather than erroring when a policy denies them.
- **Schema changes are applied by hand** in the Supabase SQL editor. There is no
  migration runner and nothing in the repository records what has been applied.
  Migration numbers `0046` and `0104` are each used twice.
- **Email confirmation is required** — new accounts cannot sign in until the
  confirmation link is clicked.
- **A player may play in more than one division** and pays separately for each
  registration.
- **Referee assignment must never block schedule creation.**
- **No CI.** `npm test` and `npm run build` are the only gates and are run by
  hand.
- **Undecided:** whether a referee workspace exists. Referee registration and
  multi-game visibility have been discussed and deliberately not built.

## Brand Commitments

- **KadaCourtHub / KCH.** Logo at `public/kch-logo.png`.
- **"One Team. One Court. One Family."** appears as a sign-off on Home, on the
  team page, and in invitation copy.
- The repository's own `AGENTS.md` pins an approved visual style and a
  no-unapproved-additions working rule. Treat it as a binding constraint and
  read it there rather than restating it here.
- **Voice:** plain and short. `AGENTS.md` requires the product be
  self-explanatory, and instructional text only where something is genuinely
  required, deadline-bound, or a payment or eligibility condition.

## Evidence on Hand

- **A real league is in the database.** WAPinoy, Cardio Friday Season IV, 40
  Over, with Div A and Div B and roughly 77 assigned players.
- **Roughly 92 real people's names** live in `supabase/migrations/`, along with
  16 birthdates and 9 phone-shaped strings. Every email in the migrations is
  `@example.com`, `@example.invalid` or `@kch.local` — none are real.
- **No credential has ever been committed.** 75 commits, no keys of any kind.
- **Real uniform and background imagery** under `public/uniforms/` and
  `public/backgrounds/`.
- **Must not be fabricated:** testimonials, other leagues, player counts,
  adoption numbers, pricing beyond the model below, or any claim that conference
  owners outside the current circle are using KCH.

**Billing model, as implemented:** a conference owner's first season is a free
pilot; later seasons charge a $50 season subscription plus $3 for every active
player in every division. Player-facing league fees remain the owner's own
collection and do not pass through KCH.

## Product Principles

1. **Answer the player's question in one screen.** The primary user opens KCH
   with a specific question and little patience. Depth belongs behind the
   answer, never in front of it.
2. **Divisions are independent.** Anything that makes one division wait for
   another is a design error, not a scheduling detail.
3. **The owner confirms; the system records.** KCH does not process payments or
   adjudicate disputes. It records what a human decided and makes that decision
   visible to everyone it affects.
4. **Finality is real.** Published rosters and final scores are commitments. The
   product should make the moment before them obvious and the moment after them
   trustworthy.
5. **Nothing needs explaining.** Per `AGENTS.md`: no duplicate labels, no
   repeated instructions, no helper text that a clear screen would make
   unnecessary.

## Accessibility & Inclusion

- **Phone-first is a product constraint, not a style preference.** The primary
  user is standing in or near a gym. A laptop layout now exists above 900px, but
  the phone remains the real usage scene.
- `AGENTS.md` requires avoiding crowded screens, tiny text and long pages.
- The current live division is **40 Over**, so the player base skews older than
  a typical recreational app audience. Legibility and touch target size carry
  more weight here than the age of the product would suggest.
- **Undecided:** no formal standard (WCAG level or equivalent) has been
  established.

## Scope

Built for WAPinoy and adjacent leagues — ones the owner runs or knows the people
running. The platform-owner invitation flow and per-conference billing exist so
the product is not hardcoded to a single league, **not** because strangers are
expected to sign themselves up. Self-serve onboarding for unknown conference
owners is not a current goal.
