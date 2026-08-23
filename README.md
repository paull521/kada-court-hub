# KadaCourtHub Next.js Working Draft v2

This converts the original static KCH prototype to Next.js + React + TypeScript using the App Router.

## Routes
- /login
- /home
- /my-team
- /schedule
- /more
- /owner

## Run locally on Mac

1. Install Node.js if you do not already have it.
2. Open Terminal.
3. Go to the migrated project folder:
   cd /Users/pdl521/.codex/.chatgpt-projects/g-p-6a7b615dbb888191aa7ea1bad708653e/kch-app
4. Install dependencies:
   npm install
5. Start the app:
   npm run dev
6. Open:
   http://localhost:3000

## Current scope
- Working route navigation
- Reusable player application shell
- Player Home
- My Team
- Schedule
- More placeholder
- Login prototype
- Owner dashboard prototype
- Role separation established
- Shared mock data

## Not real yet
- Live Supabase project connection
- Applied remote database migration
- Payments
- Seeded conference data
- Owner CRUD operations

## Recommended next engineering step
Create the Supabase project, copy `.env.example` to `.env.local`, add the Project URL and publishable key, and apply `supabase/migrations/0001_initial_schema.sql`. The app already contains cookie-based Supabase SSR clients, email/password login and sign-up actions, session refresh, and protected player routes. Without project keys, it remains in demo mode.

The approved product decisions and roadmap recovered from the project chats are in `../docs/KCH_PROJECT_BRIEF.md`.
