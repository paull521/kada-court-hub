# Visual tests

One screenshot per route per viewport, compared against a baseline on your
machine. This is the only check in the project that can see a layout break -
the Vitest suite asserts behaviour and never looks at a page.

It exists for the Tailwind migration. Converting 11,195 lines of CSS across 35
routes is not something you can verify by eye; a pixel diff is.

## Scaffolding, not infrastructure

**The baselines are gitignored.** They live in `__screenshots__/` on your disk
and nowhere else - about 37MB that the repo never carries and never has to
carry, since git history cannot be made smaller later.

There is no CI job, no repository secrets, and no second baseline set for
Linux. Those all belong to a permanent setup; this one is meant to be deleted
when the migration is done.

If it turns out to be worth keeping, the version worth keeping is a hosted
service - Argos, Chromatic, Percy - which stores baselines off-repo and gives
you a side-by-side approve/reject UI. That decision is better made after the
migration, against the new CSS, than before it against CSS you are replacing.

## First run

```bash
npx playwright install chromium     # once per machine
npm run test:visual:update          # capture the baselines
```

`.env.local` needs two values on top of the Supabase keys:

```
KCH_TEST_EMAIL=
KCH_TEST_PASSWORD=
```

The account has to reach the player, captain and owner workspaces, since the
run photographs all three.

## The loop

```bash
npm run test:visual          # what moved?
npm run test:visual:report   # open the diffs
npm run test:visual:update   # accept the current look as correct
```

Convert something, run it, look at what changed, decide. A failure prints the
route, the pixel count and the size change, and writes expected / actual / diff
images into `test-results/`.

## Notes

- Playwright builds the app and serves it on port 3001 itself. It does not use
  a dev server you have running - a production build has no dev indicator in
  the corner.
- A run takes about 2.5 minutes for 71 checks.
- Baseline folders are named `desktop-darwin` / `mobile-darwin`. macOS and
  Linux disagree about font hinting, so the platform is in the path; on a Mac
  you will only ever see the darwin set.
- `tests/visual/.auth/` holds a live session and is gitignored.
- The specs navigate and screenshot. Nothing presses a control that writes to
  the database.

## Adding a route

One line in the right array in `routes.spec.ts`, then
`npm run test:visual:update`. Dynamic routes (`/invite/[token]`,
`/join/[divisionId]`, `/platform/[section]`) are left out; they need a valid id
and the value would drift.

## What is not covered

- Interaction states: hover, focus, open menus, expanded `<details>`.
- The platform workspace, which signs in separately at `/platform/login`.
- The bottom nav's real position. A full-page screenshot captures a
  `position: fixed` element at its scroll offset, so it appears mid-page.
  Consistent every run, so it does not cause false failures - but its pinned
  position is not what is being checked.

## When the migration is done

Delete `tests/visual/`, `playwright.config.ts`, the three `test:visual`
scripts, and `@playwright/test`. Nothing else depends on any of it.
