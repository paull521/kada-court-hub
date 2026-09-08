# Visual tests

One screenshot per route per viewport, compared against a committed baseline.
This is the only check in the project that can see a layout break - the Vitest
suite asserts behaviour and never looks at a page.

It exists for the Tailwind migration. Converting 11,195 lines of CSS by eye
across 35 routes is not verifiable; a pixel diff is.

## Running it

```bash
npm run test:visual          # compare against the baselines
npm run test:visual:update   # accept what you see as the new baselines
npm run test:visual:report   # open the last HTML report
```

Playwright builds the app and serves it on port 3001 itself. It does not use
whatever dev server you have running - a production build has no dev indicator
in the corner and matches what Vercel serves.

## Credentials

`.env.local` needs two values on top of the Supabase keys:

```
KCH_TEST_EMAIL=
KCH_TEST_PASSWORD=
```

The account has to reach the player, captain and owner workspaces, since the
run photographs all three. `tests/visual/.auth/user.json` holds the resulting
session and is gitignored - it is a live login, not a fixture.

The specs navigate and screenshot. Nothing in them presses a control that
writes to the database.

## Baselines are per platform

`__screenshots__/desktop-darwin/` and `__screenshots__/desktop-linux/` are
separate sets, because macOS and Linux disagree about font hinting and
antialiasing and a baseline shot on one will never match the other.

Generate the Linux set from the same container CI uses (Docker must be
running):

```bash
npm run test:visual:linux
```

Commit both sets. Without the Linux baselines the CI job fails on every route.

## After an intentional visual change

Run `npm run test:visual:update`, look at the diff in the report, then commit
the new baselines **in the same commit as the change that caused them**. A
baseline update on its own is unreviewable - the point is that the diff sits
next to the CSS that moved it.

## Adding a route

One line in the right array in `routes.spec.ts`, then
`npm run test:visual:update`. Dynamic routes (`/invite/[token]`,
`/join/[divisionId]`, `/platform/[section]`) are left out; they need a valid id
and the value would drift.

## What is not covered

- Interaction states: hover, focus, open menus, expanded `<details>`.
- The platform workspace, which signs in separately at `/platform/login`.
- Anything below a `networkidle` that keeps loading - the shot waits for the
  skeleton placeholders to clear, but a slow route could still be caught mid-fill.
