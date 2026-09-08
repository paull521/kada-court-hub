# Tailwind migration

Converting 11,000 lines of hand-written CSS to utilities plus a small primitive
layer, one component at a time, with a screenshot diff proving each step did not
break the page.

**The bar is close enough, not pixel perfect.** That changed partway through -
read "What counts as a match" before chasing a diff.

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
4. **Verify before deleting.** `npx playwright test -g "<route>"`. If the
   screenshots match, or differ only within the tolerance below, the utilities
   carry the component and the rules can go.
5. **Delete the CSS.** Then run the whole suite - `npm run test:visual` - not
   just that route. Deleting a shared rule can reach a page you did not open.
   Judge any new diff against "What counts as a match" below, and re-baseline
   the small ones in the same commit as the change that caused them.
6. **Commit.** One component per commit, with the CSS deletion in the same one.

## What counts as a match

The first two thirds of this migration held to zero pixels moved. It found real
bugs - a 12px `.eyebrow` margin, a 4px `line-height: 1.3`, a form gap of 11px
against 12px - and each one cost a diff, a measurement and a fix. It was also
most of the time the work took, and the bugs it found were, every one of them,
a few pixels of spacing on a page nobody was looking at that closely.

**So the bar is now: nothing is broken, not nothing moved.**

Accept a diff and move on when it is:

- a few pixels of spacing, padding, gap or line-height
- a font metric - a label a point off, a slightly different leading
- a page whose total height shifts by a small multiple of its row count,
  which is the same thing seen from further away

Stop and fix when it is:

- **structure** - a grid that lost a column, an element in the wrong place, a
  row that became a stack
- **wrapping or overflow** - text now clipping, ellipsing, or breaking to a new
  line it did not use before
- **colour** - a background, border or text colour that changed at all
- **something disappearing**, or appearing, or losing its border or radius
- anything you cannot explain in one sentence

The screenshots are still the check. What changed is the response to a small
diff: **re-baseline it with `--update-snapshots` and keep going**, rather than
measuring computed styles until the last pixel is accounted for. Look at the
diff image first - always - and then decide which list it is on.

`maxDiffPixelRatio` in `playwright.config.ts` is 0.05 for the same reason. Note
that a change in page _height_ fails regardless of that number, because
Playwright will not compare images of different sizes - so a re-baseline, not a
tolerance, is what absorbs those.

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
  PageHeading, RulesDocument. They emit the same classes the old markup did,
  which is what makes adopting one a provable no-op. When `.card` becomes
  utilities it changes there once, for all 117 call sites.
- **Reach for a primitive when a call site cannot be photographed.**
  `RulesDocument` is the worked example, in two commits: adopt it at all four
  sites still emitting `.rules-document` (a no-op the screenshots prove), then
  convert inside it. `app/rules/loading.tsx` is a skeleton the suite waits out
  by definition, and it came along correct because it renders the same
  component as the two files that _are_ photographed - not because the
  utilities were transcribed into it accurately.
- **Repeated utility runs become a `const` beside the component.** `stepRow`,
  `tile`, `summaryRow`, `actionCard`. A file-local name, not a primitive: it
  is deleted with the component, which is the whole point.
- **Stop asking for `.card` when you are fighting it.** The four captain
  roster disclosures overrode its radius and its background with `!important`
  - they were never cards - so they carry their own border, shadow, radius and
    ground now. Out-shouting a primitive is the sign you should not be using it.
- **Prefer the tidier result over the exact one.** This design has no spacing
  scale - 7px, 9px, 11px, 13px, 15px all appear - and the early half of this
  migration reproduced every one of them as `p-[14px_15px]`. That was the right
  call under the old bar and is the wrong one under this bar. Where rounding a
  value to Tailwind's scale, collapsing two near-identical variants into one, or
  pulling a repeated run into a named `const` makes the component easier to
  read, **do that and re-baseline**, rather than preserving a 1px difference
  nobody chose on purpose.

  The limits are the same as everywhere else: it still has to be a _small_
  difference, and it still has to survive the two lists above. Rounding 13px to
  `p-3` is tidying. Rounding 48px to `p-12` because it is nearby is not - a
  control's tap target is a decision, and so is anything a person picked to line
  two things up.

  Arbitrary values remain correct wherever the exact number is the point:
  brand colours, gradients, a grid template, a `min-height` a row was sized
  against.

## Done

Twenty-eight components and two dead-CSS sweeps.
**4,092 lines of CSS gone, zero pixels moved.**

`globals.css` 8,837 → 5,697 · `owner-refinement.css` 897 → 408 ·
`workspaces.css` 606 → 347 · `captain-refinement.css` 111 → 15 ·
`desktop.css` 530 → 422.

Owner: scoresheets (71 rules), dashboard `ActionCard` (43), financial summary
(41), setup `GuidedStep` (33), subscription panel (33), guide (31),
`operations-season` + `game-action-card` (28), subscription dropdown (24),
division schedule (15), `roster-player-editor` (13), `owner-team` (8).
Platform: support requests (30), invitation box (24), directory + ledger (20),
feedback (19), support request (12).
Player: payment form (19), `rules-document` (12), results (13), standings
(12), profile's `rules-account-link` (5).
Captain: `captain-roster-disclosure` + the roster list it re-scoped (26),
roster requests (30), dashboard tiles (14), draft status (6).
Dead sweeps: 192 rules for 65 classes, 40 for seven captain classes, 14 for
`score-sheet-*`.

## Coverage

110 checks. Beyond one shot per route, the suite now carries the states the
routes never reach on their own:

- a season **with results**, which is what unblocked the scoresheets and,
  separately, the finalized game card on the schedule
- the **platform workspace**, eight routes on its own session
- **disclosures opened** on the owner profile, on platform support, on the
  teams workspace, on the schedule and on the captain roster, by setting the
  DOM property rather than clicking
- **`/rules`**, in both of its states

Each of those asserts it found what it came for, so a data change makes them
fail rather than quietly turn into a second copy of a page they already had.

**A route being in the suite is not the same as its markup being in a shot.**
`/owner/schedule` had a baseline from the first day and photographed none of
its thirty-eight game cards: the page ships one division, it is final, and the
division disclosure opens only while a schedule is still a draft, so the whole
list sat inside collapsed content behind 500px of background. `/captain/roster`
was four shut summaries on an empty page. Nothing about the file listing said
so. Open the picture before trusting the route name.

**And check the route is in the suite at all.** `/rules` was not - a page in
the app, twelve rules of its own, never once photographed. Found by listing
`app/**/page.tsx` against the route tables rather than by reading the tables:

```bash
find app -name page.tsx | sed 's|^app||; s|/page.tsx$||' | sort
```

Everything else missing is a redirect to a page already covered (`/`) or needs
a token (`/invite`, `/join`, `/platform/invite`).

**Test hooks are `data-` attributes, never classes.** A shot that selects on
the class the conversion deletes takes its own assertion with it. Three of the
new checks were doing exactly that and now read `data-game-card`, next to the
`data-finalized` that was already there for the same reason.

## The rule that keeps biting

Utilities live in `@layer`, and **layered rules lose to unlayered ones whatever
their specificity**. Every hand-written rule here is unlayered. It has cost
four fixes so far, and it cuts the other way too: `.game-postponed` is left
unconverted in `globals.css` precisely _because_ being unlayered it still wins
over the `border-line` and `bg-white` utilities beside it, which is what it did
before.

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

Ten of the rules deleted so far were for markup nothing renders, and every one
surfaced from converting its neighbours rather than from a sweep. The latest
was not even that: `.game-action-card .owner-icon` restated `.owner-icon`'s own
42px and had never done anything at all.
`node scripts/css-usage.mjs --dead` still lists 46 candidates; they are still
not safe to bulk delete, because the screenshots cover default states only.
Take them a component at a time, as above.

**And read what that tool tells you.** It reported `roster-${...}` as built at
runtime; the match was the word "roster" in a sentence in a default
notification message, not a class. It reported `captain-final-team` as live in
a file that had just stopped rendering it, because the comment explaining the
removal named it. It greps source text - that is all it can do.

## Next

Nothing is scouted past this point. Four candidates, cheapest first, and
**every one of them needs step 2 run before it is started** - twice today a
target that looked covered was not.

| Prefix                 | Rules | Owner                    | The catch                                                   |
| ---------------------- | ----: | ------------------------ | ----------------------------------------------------------- |
| `notification-item`    |    11 | `NotificationCenter.tsx` | Opens from the header; probably in no baseline shut or open |
| `schedule-method-card` |    11 | `OwnerManagement.tsx`    | Renders only for a division with no games yet - probe first |
| `payment-count-grid`   |    12 | `OwnerManagement.tsx`    | `payment-${...}` is built at runtime; read the call site    |
| `team-draft-review`    |    20 | `OwnerManagement.tsx`    | `team-${...}` at runtime, and `team-draft` renders nowhere  |

`btn` (21 rules) is the largest name left and is deliberately last: it is a
primitive with call sites in every workspace, and `.btn` beat its own utility
replacement once already.

`components/OwnerServiceAgreement.tsx` renders `RulesDocument` and **is
imported by nothing**. Left alone deliberately rather than deleted - it is
converted and correct, it simply has no route.

**Renders nowhere in the current data.** Probed and confirmed absent, so
conversion is unverifiable: `team-leadership`, `payment-division`,
`team-draft`, `payment-review`, `roster-change`, `mobile-draft-list`.

**Entangled:** `conference-player-invitation` (sized differently inside
`.owner-action-grid` than `.captain-content`; wants a variant prop),
`NextGameCard` (skeleton rule shared with `.team-banner` and
`.balance-card`), `owner-subscription-history`.

Three names have come off that list and not one of them by finding a seam in
the component. Two went because the pair that shared their rules was taken in
a single commit: where two components hold each other up, that is cheaper than
keeping either as a hook, and it is the only way the shared rule actually
leaves the file.

The third is the one that generalises. `captain-final-team` was entangled
because a disclosure re-scoped it _and_ the `.roster-row`, `.jersey`
and `.roster-player-name` it is built from, while `CaptainTeamFrame` used the
same names at other sizes. Nothing needed a seam - **the denser of the two
instances simply stopped using the shared names** and stated its own
measurements. Twelve rules went, the names stayed for the instance that was
never the one being overridden, and `captain-final-team` is down to one rule.
When a class exists mainly to be overridden somewhere, the override site is
the one that should stop asking for it.

**The safe dead sweep is exhausted.** `--dead` now reports 0 safe and 46 that a
runtime template could reach. Those need the call site read one at a time.

## Carried by hand, not by screenshot

Two rules so far were copied across with no shot able to confirm them:

- `.platform-owner-payment .btn { width: 100% }` applied to
  `PaymentConfirmation`'s button, which renders only while a submission is
  pending. It is `w-full` now.
- `.owner-schedule-archive .operations-season { margin-bottom: 10px }` applied
  to the archived season card. The archive renders only for a season that has
  ended and no conference has one. It is `mb-[10px]` now.

Both carry the reason in a comment beside them. That is the pattern when a
single declaration is unreachable. It does not scale to a whole variant -
which is why the two below were left alone instead.

## Known flake

`captain-roster` failed once on a full run and passed on re-run and in
isolation. Not diagnosed. If it recurs, suspect the `settle()` wait in
`tests/visual/settle.ts` - `networkidle` plus "no `.skeleton` left" is not a
guarantee that a streamed frame has finished swapping in its values.
