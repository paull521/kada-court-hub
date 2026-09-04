# KadaCourtHub Next.js Working Draft v2

This converts the original static KCH prototype to Next.js + React + TypeScript using the App Router.

## Routes

- /login
- /home
- /my-team
- /schedule
- /more
- /owner

## Run locally

Requires Node 20.9 or newer.

```bash
npm install
cp .env.example .env.local   # add the Supabase URL and publishable key
npm run dev -- --port 3001   # http://127.0.0.1:3001
```

Port 3001 is the project convention and matches `allowedDevOrigins` in
`next.config.ts`. With `.env.local` left empty the app runs in demo mode:
it builds and serves, but there is no login and no live data.

Other commands:

```bash
npm run build    # the only gate - there are no tests and no CI
npm start        # serve the production build
npm run format   # Prettier
```

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

- Payments
- Owner CRUD operations

## Database

`supabase/migrations/` holds numbered SQL files applied by hand in the Supabase
SQL Editor - there is no migration runner and no record in the repo of what has
been applied. Confirm the live schema before writing a new migration, and note
that `0046` and `0104` are each used twice, so the next free number is `0109`.

`supabase/testing/` contains demo-data scripts. Those are not schema and must
never be run against real league data.

See `KCH_HANDOFF.md` for the product hierarchy, role model, and workflow rules.
