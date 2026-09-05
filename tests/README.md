# Tests

Run with `npm test` (single pass) or `npm run test:watch`. Vitest, configured
in `vitest.config.mts`.

## Layout

```
tests/
  unit/lib/      Pure functions. No database, no mocks, no React.
  contracts/     Invariants checked by reading the source tree.
  components/    React components rendered in jsdom.
  support/       Shared setup and module stubs.
```

## What each folder is for

**`unit/lib/`** — pure projection logic pulled out of the data modules: fee
visibility, roster ordering, role naming, and the coercion of untyped RPC JSON.
These encode product rules with money and permissions behind them, so they are
tested branch by branch. Add a test here whenever you add a function that turns
database rows into something the UI renders.

**`contracts/`** — architectural invariants rather than behaviour. They read
the real source files and fail when a rule this codebase depends on gets broken
somewhere far away from the test. Each one exists because the rule was actually
violated at some point:

| Test                       | Rule it protects                                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `page-data-scope`          | A page on a narrow scope only reads fields that scope returns. Otherwise it silently renders a fallback default instead of real data. |
| `captain-identity`         | "Is this account a captain" has one definition, used at all three read sites.                                                         |
| `loading-boundaries`       | Every page that renders a shell _and_ awaits data has a `loading.tsx` above it.                                                       |
| `supabase-select-literals` | `.select()` arguments stay single string literals. Concatenation silently collapses supabase-js row typing to `GenericStringError`.   |

**`components/`** — rendering behaviour that is easy to regress and hard to
notice. Needs the `// @vitest-environment jsdom` docblock at the top of the file.

## Conventions

- Name the file after the thing under test, not the file it lives in.
- Prefer several small assertions over one large snapshot; a failing test should
  name the rule that broke.
- A test comment should say _why the rule exists_, not restate the assertion.

## Known gaps

- The data functions themselves (`getPlayerPortalData`, `getOwnerPortalData`,
  `getCaptainPortalData`) are not covered. They are long, Supabase-coupled, and
  testing them properly means either a fake PostgREST or a seeded test project.
- Nothing verifies that the embedded `select()` strings return the same rows the
  older separate queries did. That needs an authenticated session against real
  data.
- Server actions in `app/**/actions.ts` are untested.
