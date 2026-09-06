# KCH Handoff

Use this document when continuing KADA Court Hub in a new Codex chat.

## Start here

- **Repository:** `/Users/pdl521/.codex/.chatgpt-projects/g-p-6a7b615dbb888191aa7ea1bad708653e/kch-app`
- **Branch:** `main`
- **GitHub remote:** `https://github.com/paull521/kada-court-hub.git`
- **Production app:** `https://www.kadacourthub.com`
- **Platform login:** `https://www.kadacourthub.com/platform/login`
- **Player, captain, and owner login:** `https://www.kadacourthub.com/login`

Read `AGENTS.md` in this folder before making changes. It contains the agreed KCH working rules: collect approved scope first, do not add unapproved features, make the smallest necessary change, and run relevant validation.

## Run the app locally

```bash
cd /Users/pdl521/.codex/.chatgpt-projects/g-p-6a7b615dbb888191aa7ea1bad708653e/kch-app
npm install
npm run dev -- --port 3001
```

Use `npm run build` before a handoff or publication. The project uses Next.js 16 and Supabase.

## Supabase database

- **Project ref:** `ehkxdcjsyopihpbqeqnq`
- **Dashboard:** `https://supabase.com/dashboard/project/ehkxdcjsyopihpbqeqnq`
- **Local configuration:** `.env.local` is intentionally untracked and contains the app's Supabase URL and publishable key. Never paste its values into chat, documentation, source control, or migrations.
- **Database migrations:** `supabase/migrations/`, numbered `0001` through `0108`.

The user runs SQL migrations in the Supabase SQL Editor. Before proposing a migration, inspect the existing schema and the latest migration files. Before asking the user to run a new migration, provide one complete, idempotent SQL script and state its purpose. Do not assume every local migration has been applied; ask the user or verify in the SQL Editor when needed.

The app relies on Supabase RLS and security-definer database functions. Keep conference isolation and role checks inside database functions; do not replace them with client-side checks.

## Hosting and email

- **Vercel project:** `kch-bball-pilot`, connected to `main`; a push to `main` deploys production.
- **Domain:** `kadacourthub.com`, DNS managed in Cloudflare.
- Root domain redirects to `www.kadacourthub.com` in Vercel.
- **Auth email:** Supabase custom SMTP is configured through Resend using `auth@kadacourthub.com`.
- Supabase Site URL and reset redirect URLs include both:
  - `https://www.kadacourthub.com/reset-password`
  - `https://kadacourthub.com/reset-password`

Never request, display, or commit Resend API keys, SMTP passwords, Supabase service-role keys, or account credentials.

## Current Version 1 state

- Payment pages use the owner payment ledger; owners record Zelle/Cash transfers and Platform confirms them. KCH tracks obligations only and does not process player money.
- Season Subscription pricing is $50 per owner per season plus $3 for each active player registered in a division. The $100 setup fee is removed.
- Selected pilot conferences may receive one complimentary regular season, excluding playoffs.
- Players must create profiles through a conference invitation; profiles can belong to multiple conferences and divisions.
- Owners can manage players, teams, captain/co-captain leadership, schedules, scores, and payments within their conference.
- Platform can manage owners and confirm owner payments.
- Password reset uses Supabase/Resend and was live-tested successfully.
- Current recent fixes, all published:
  - `38cd027` — player team context on first Home load; resilient password reset handling; sign out before returning to Login.
  - `34185e6` — invalidate Home after login so the authenticated first render is fresh.

## Contract decisions

- Owners collect and handle actual player funds; KCH does not process them.
- Owner payment is due when they collect league fees from active players registered in divisions, or when the season starts, whichever comes first.
- Platform may manually suspend an owner after discussing an unpaid balance; there is no automatic grace period.
- The full owner agreement requires legal review before it becomes the final in-app agreement.
- Draft artifact (not committed): `KADA_Court_Hub_Owner_Service_Agreement_Draft.docx`.

## Version 2 roadmap — approved for future planning, not yet implementation

1. Owner announcements to their conference.
2. Browser push notifications for games, schedule changes, and payment notices.
3. Conference logo upload and photo uploads for announcements/league content.
4. End-of-season archive and next-season workflow.
5. Player and team statistics.
6. Photo/camera-assisted scoresheet capture, reviewed before stats publish.
7. Native iPhone and Android KADA Court Hub apps after web features are stable.
8. Rare admin-only deletion for duplicates/mistakes/privacy, with clear warning and retained history for normal departures.

Explicitly excluded: owner impersonation/support mode, unrestricted conference joining, player leave-request flow, and automatic owner-payment suspension.

## Repository hygiene

- Treat `sources/` as read-only.
- Do not commit `.env.local`, API keys, SQL editor exports, or `supabase/.temp/`.
- At the time of this handoff, the draft owner agreement and `supabase/.temp/` are local/untracked; leave them out of product commits unless the user explicitly asks otherwise.
- Run `git status --short` before commits. Stage exact intended files only.
- Publish only after the user asks to publish, except when they explicitly authorize a production bug fix to be released.
