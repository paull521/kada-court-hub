@AGENTS.md

# Working notes

## Checks

`npm test` (162) · `npm run build` · `npx tsc --noEmit` · `npx prettier --check app components lib`

Run them before pushing. `.github/workflows/checks.yml` runs the same four on
every pull request and on push to `main`, so a miss is caught rather than shipped.

## Shape

- Shells: `AppShell` (player), `CaptainShell`, `OwnerPageShell`. One account can hold several roles.
- Bottom-nav tables live in `lib/nav-links.tsx`, one per workspace. Never hand-copy one.
- `/profile` renders by `?view=captain|owner`. Links to it must carry the role.
- Data per role, no ORM: `lib/{kch,captain,owner,platform}-data.ts`.
- Migrations are applied by hand in the Supabase SQL editor. Next is `0117`. Log every one you run in `supabase/APPLIED.md`, which also lists the gaps and duplicates in `0001`-`0116`.

## CSS

Migrating to Tailwind. Read `MIGRATION.md` before touching a stylesheet - it
carries the loop, the conventions and what is deliberately blocked.
`node scripts/css-usage.mjs <prefix>` scopes a component before you convert it.

Seven stylesheets, imported in this order by `app/layout.tsx`: `globals.css`, `workspaces.css`, `patriotism.css`, `captain-refinement.css`, `owner-refinement.css`, `kch-logo.css`, `desktop.css`.

- `app/globals.css` is one 8,700-line file. Grep it whole before editing a selector — a later duplicate wins at equal specificity. Then grep the six files after it, which win over all of it.
- **Every desktop rule goes in `app/desktop.css`, never in `globals.css`.** It is imported last so it actually wins; a desktop rule in `globals.css` loses to the six files that load after it. That is not theoretical — the four-across captain dashboard sat there as dead CSS. `tests/contracts/desktop-layer.test.ts` enforces both the single `@media (min-width: 900px)` and the import position.
- One measure per page, set on `.shell` with `:has()` and read by the content: `--page` (1180px) for two-column pages, tile grids and the owner workspace; `--page-stack` (880px) for single-column pages. The header and the tab strip do not read it - they hold `--page` everywhere, so the chrome stays put when the measure changes from one tab to the next.

## How the author works

- Commit the moment a task is done. Never bunch finished tasks into one commit.
- Leave a visual change uncommitted while they judge it; commit as soon as they approve.
- One commit per change, not per attempt. `git reset` a rejected unpushed commit.
- Never push until told.
- An instruction about one workspace is scoped to that workspace. Ask before carrying it to another shell.
- Hide or remove a component at the component, not with CSS `display: none`.
- Adding something to a block must not resize the block. Shrink what goes in.
- Report finished work as a bulleted list with file paths.

## Log the work

`~/AgentVault` — read its `CLAUDE.md` first. Append to `daily/YYYY-MM-DD.md` as work lands, not at session end. Update `projects/kada-court-hub.md` when the app's state changes. Commit there without asking.
