# Tailwind migration

Converting 11,000 lines of hand-written CSS to utilities plus a small primitive
layer, one component at a time, with a screenshot diff proving each step moved
no pixels.

## Why

`globals.css` had no deletion story. A component's styling lived thousands of
lines away in a file shared with everything else, so nobody could change a rule
without reading the whole file, and nobody could delete one without proving a
negative. The file could only grow.

Scoped styles fix both: the styling of a component is in the component, and
deleting the component deletes the styling.

## The loop

Per component, in this order. Do not skip step 2.

1. **Scope it.** `node scripts/css-usage.mjs <prefix>` — how many rules, which
   stylesheets, and whether anything builds the name at runtime. One owner and
   no runtime construction means it is safe to convert and delete together.
2. **Check the screenshots cover it.** Open the baselines for the routes the
   component appears on and confirm the states you are about to rewrite are
   actually in the picture. A branch that renders only for a finalized game, a
   declined payment or a suspended owner is not in any screenshot, and
   converting it is unverifiable. Either add a route that shows that state
   first, or leave that branch alone.
3. **Convert the markup.** Utilities on each element. Name the elements the CSS
   used to reach by position - `span:first-child`, `> summary > strong` - so
   nothing depends on child order any more.
4. **Verify before deleting.** `npx playwright test -g "<route>"`. The old CSS
   is still present and now inert; if the screenshots match, the utilities
   reproduce it exactly and the rules are provably dead.
5. **Delete the CSS.** Then run the whole suite - `npm run test:visual` - not
   just that route. Deleting a shared rule can reach a page you did not open.
6. **Commit.** One component per commit, with the CSS deletion in the same one.

## Conventions

- **No Preflight.** `app/tailwind.css` imports theme and utilities only.
  Tailwind's reset would strip the defaults 8,000 lines of CSS are written
  against. It can be adopted at the end, when nothing depends on them.
- **Breakpoints are named after the app's own.** `desk:` is 900px, the line
  `app/desktop.css` is built around. `max-tiny:` is the 410px small-phone
  adjustment. Tailwind's `sm/md/lg` exist but this app has never used them.
- **Colours bind by reference.** `--color-navy` reads `--navy`, so `bg-navy`
  and the old `.primary` cannot drift.
- **Primitives live in `components/ui/`.** Card, Button, Eyebrow, FormMessage,
  PageHeading. They currently emit the same classes the old markup did, which
  is what makes adopting one a provable no-op. When `.card` becomes utilities
  it changes there once, for all 117 call sites.
- **Arbitrary values are expected.** This design has no spacing scale - 7px,
  9px, 11px, 13px, 15px all appear. A faithful conversion produces
  `p-[14px_15px]`, and that is correct. Normalising to a scale changes pixels
  and is a separate, deliberate pass with a human looking at the diffs.

## Done

| Step                               | Result                            |
| ---------------------------------- | --------------------------------- |
| Tailwind installed, no Preflight   | 71/71 visual, zero pixels moved   |
| `components/ui/` primitives        | additive, unused at first         |
| `OwnerFinancialSummary` converted  | 41 rules deleted, 186 lines       |
| `score-sheet-*` dead rules deleted | 14 rules, nothing referenced them |
| `scripts/css-usage.mjs`            | scoping and dead-class analysis   |

`globals.css` 8,837 → 8,613. `desktop.css` 530 → 517.
`owner-refinement.css` 897 → 876. 258 lines of CSS gone.

## Blocked, and why

**`OwnerScoresheets`** is the largest contained target left - it is the sole
owner of 87 rules across `scoresheet-`, `scoreboard-` and `score-entry-`. It is
not converted because `.scoreboard-match`, the finalized-game display, renders
only when `game.finalized` is true and no baseline contains a finalized game.
Six rules would be rewritten with nothing able to check them.

To unblock: capture a route showing a finalized game - either seed one in the
demo conference, or add a screenshot of a season whose games are complete -
then convert.

It also has the worst override warfare in the codebase: `.scoreboard-card` is
defined in both `globals.css` and `owner-refinement.css`, the second winning
through `!important`, and `.scoreboard-meta` takes its padding from one file
and its padding-top from the other. Read the effective style, not either rule.

## Dead CSS

`node scripts/css-usage.mjs --dead` reports 137 classes no `.ts` or `.tsx`
names, split into 93 that no runtime template could produce and 44 that one
could - `status-${x}`, `game-${phase}`, `division-schedule-${status}`.

**Do not bulk delete either list.** The screenshots cover default states only,
so a class styling an error, a canceled game or a suspended owner is in no
picture and its deletion cannot be verified by running the tests. The 93 are
worth reading through by hand; the 44 need the call site checked first.

## Not yet started

`OwnerManagement` (67 primitive uses, the largest file), `PlatformOperations`,
`PlatformCreatorTools`, `AuthForm`, and the captain and player workspaces.
`owner-refinement.css` and `captain-refinement.css` are the files to watch -
1,008 lines that exist only to outrank `globals.css`, and they should end at
zero.
