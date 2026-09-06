@AGENTS.md

# Working notes

## Checks

No CI. Run after every change:

`npm test` (135) · `npm run build` · `npx tsc --noEmit` · `npx prettier --check app components lib`

## Shape

- Shells: `AppShell` (player), `CaptainShell`, `OwnerPageShell`. One account can hold several roles.
- Bottom-nav tables live in `lib/nav-links.tsx`, one per workspace. Never hand-copy one.
- `/profile` renders by `?view=captain|owner`. Links to it must carry the role.
- Data per role, no ORM: `lib/{kch,captain,owner,platform}-data.ts`.
- Migrations are applied by hand in the Supabase SQL editor. Next is `0109`; `0046` and `0104` are duplicated.

## CSS

- `app/globals.css` is one 8,900-line file. Grep it whole before editing a selector — a later duplicate wins at equal specificity.
- One breakpoint: `@media (min-width: 900px)`. Every desktop rule goes inside it.

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
