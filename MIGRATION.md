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

Fifteen components. **2,186 lines of CSS gone, zero pixels moved.**

| Component / step                 | Rules |
| -------------------------------- | ----- |
| Tailwind installed, no Preflight | 0     |
| `components/ui/` primitives      | 0     |
| `OwnerScoresheets`               | 71    |
| Owner dashboard `ActionCard`     | 43    |
| `OwnerFinancialSummary`          | 41    |
| Setup wizard `GuidedStep`        | 33    |
| Owner subscription panel         | 33    |
| Owner's guide                    | 31    |
| Support requests                 | 30    |
| Season subscription dropdown     | 24    |
| Owner-invitation box             | 24    |
| Owner directory + payment ledger | 20    |
| `PlatformFeedback`               | 19    |
| `score-sheet-*` (dead)           | 14    |
| `ResultsFrame`                   | 13    |
| `StandingsFrame`                 | 12    |
| Owner support request            | 12    |
| `owner-team` (mostly dead)       | 8     |

`globals.css` 8,837 → 7,168 · `owner-refinement.css` 897 → 476 ·
`desktop.css` 530 → 439.

## Coverage

94 checks. Beyond one shot per route, the suite now carries the states the
routes never reach on their own:

- a season **with results**, which is what unblocked the scoresheets
- the **platform workspace**, eight routes on its own session
- **disclosures opened** on the owner profile and on platform support, by
  setting the DOM property rather than clicking

Each of those asserts it found what it came for, so a data change makes them
fail rather than quietly turn into a second copy of a page they already had.

## The rule that keeps biting

Utilities live in `@layer`, and **layered rules lose to unlayered ones whatever
their specificity**. Every hand-written rule here is unlayered. It has cost
four fixes so far:

| The unlayered rule                                        | What it beat                          |
| --------------------------------------------------------- | ------------------------------------- |
| `.secondary { background: #fff }`                         | `bg-white/[0.14]` on a dark button    |
| `button, input { color: inherit }`                        | `text-navy` on the score inputs       |
| `button, input { font: inherit }`                         | `text-[12px]` on two platform buttons |
| `.card`, `.platform-operation`, `.btn` padding and radius | their utility replacements            |

**Where the old CSS carried `!important`, or won a fight on specificity or
source order, expect to need Tailwind's `!`.** And where a primitive drags in a
class that fights you - `.card` behind a navy gradient - stop asking for the
class rather than out-shouting it.

The font-size one was invisible in a pixel diff. Reading computed styles off
the live page found it in one pass:

```ts
await page.evaluate(() => getComputedStyle(el).fontSize);
```

Worth reaching for early when a diff is small and uniform.

## Dead CSS keeps turning up on its own

Nine of the rules deleted so far were for markup nothing renders, and every one
surfaced from converting its neighbours rather than from a sweep.
`node scripts/css-usage.mjs --dead` still lists 100+ candidates; they are still
not safe to bulk delete, because the screenshots cover default states only.
Take them a component at a time, as above.

## Next

Probing what a route actually renders is step 2 of the loop and keeps paying:

```ts
await page.evaluate(() => document.querySelectorAll(".thing").length);
```

**Renders nowhere in the current data** - converting these is unverifiable, and
they may be dead in practice rather than only in theory:

- `mobile-draft-list` (15 rules) - zero on `/owner/roster`, `/owner/setup` and
  the teams view. Referenced at `OwnerManagement.tsx:1398`, so it is reachable
  code, just not reachable data.

**Entangled, needs its neighbours first:**

- `operations-season` (13) shares its summary rules with `.game-action-card`
  and is re-scoped by `.owner-schedule-archive` and `.owner-schedule-current`.
- `conference-player-invitation` (16) is sized differently inside
  `.owner-action-grid` than inside `.captain-content`. It needs a variant prop
  rather than an ancestor selector - a real improvement, but it changes two
  call sites.
- `NextGameCard` - its skeleton rule is shared with `.team-banner` and
  `.balance-card`, so that selector must be edited rather than deleted.
- `owner-subscription-history` - summary grid entangled with
  `.payment-history-panel`.

**Clean and waiting:** `schedule-method` (13), `captain-task` (16),
`captain-draft` (23) and most of the captain workspace. Several build class
names at runtime, so read the call site before trusting `--dead`.

**Hooks left in place on purpose.** Three classes now carry no styles of their
own and stay only because a descendant rule still reaches through them:
`owner-action-grid`, `owner-team-list`, and `.platform-operation` on the invite
box. Each has a comment saying what it is waiting for.

## Carried by hand, not by screenshot

One rule so far was copied across with no shot able to confirm it:
`.platform-owner-payment .btn { width: 100% }` applied to
`PaymentConfirmation`'s button, which renders only while a submission is
pending. It is `w-full` now, with the reason in a comment beside it.

That is the pattern when a single declaration is unreachable. It does not scale
to a whole variant - which is why the two above were left alone instead.

## Known flake

`captain-roster` failed once on a full run and passed on re-run and in
isolation. Not diagnosed. If it recurs, suspect the `settle()` wait in
`tests/visual/settle.ts` - `networkidle` plus "no `.skeleton` left" is not a
guarantee that a streamed frame has finished swapping in its values.
