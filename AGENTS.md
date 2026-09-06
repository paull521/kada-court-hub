# KCH Codex Working Rules

## 1. Collect First, Code Second

Before coding, gather and consolidate all approved design decisions, business rules, and requested changes for the current task.

Do not begin implementation while the requested scope is still being collected.

## 2. No Unapproved Additions

Implement only what has been explicitly approved.

Do not add:

- New features
- Extra UI elements
- Additional workflows
- Unrequested helper text
- Design changes
- Speculative improvements
- Unnecessary refactors

If something may be useful but was not approved, leave it unchanged.

## 3. Keep KCH Simple and Self-Explanatory

KCH should be intuitive without unnecessary instructions telling users how to use each page.

Remove or avoid:

- Duplicate information
- Repeated labels
- Redundant instructions
- Unnecessary descriptions
- Excessive helper text

Instructional text should only be added when it is genuinely important, such as:

- Required actions
- Critical notifications
- Warnings
- Deadlines
- Eligibility or payment requirements
- Explicitly approved subtitles

## 4. Make the Smallest Necessary Change

Preserve existing working functionality and approved designs.

Do not modify unrelated areas of the application.

Avoid broad rewrites or architectural changes unless they are required for the approved task.

After implementation:

- Run the relevant build/checks.
- Fix errors caused by the changes.
- Confirm the affected workflow still functions correctly.

The goal is to complete the approved scope cleanly without creating additional work.

## 5. Protect the Version 1 Core

KCH Version 1 is the stable production baseline.

Existing Version 1 functionality, business rules, database relationships, security behavior, and approved workflows should be treated as established core behavior.

Future development should normally be implemented as an addition to Version 1 rather than by changing the existing core.

### Preserve the Core

Do not modify, replace, redesign, or restructure existing Version 1 behavior unless the user explicitly approves a change to that specific behavior.

An additive feature may touch existing Version 1 code, tables, functions, or components when necessary. The constraint is to preserve established behavior unless its change has been explicitly approved.

This includes:

- Authentication and role behavior
- Conference isolation
- Player profiles and conference memberships
- Owner, captain, and player workflows
- Season and division structure
- Team and roster relationships
- Scheduling
- Payment and fee records
- Owner payment ledger behavior
- Platform administration
- Supabase RLS and security-definer functions
- Existing database relationships
- Approved Version 1 UI and navigation

### Prefer Additive Development

When adding new capabilities:

- Extend the existing system instead of rewriting it.
- Add new tables, columns, functions, routes, or components only when required.
- Preserve existing interfaces and database contracts whenever practical.
- Do not change an existing workflow merely to make a new feature easier to implement.
- Do not refactor stable Version 1 code unless the approved feature genuinely requires it.
- Keep new features isolated from the Version 1 core where practical.

If a requested feature appears to require changing established Version 1 behavior, stop before implementation and explain:

1. What existing behavior would need to change.
2. Why the change is necessary.
3. What existing workflows or data could be affected.
4. Whether an additive alternative is available.

Do not make that core change without explicit approval.

### Database Protection

Existing production migrations are historical records and must not be rewritten after they have been applied.

Schema changes must use a new numbered migration.

Do not remove or reinterpret existing production data to support a new feature.

New database functionality must preserve:

- Existing records
- Existing foreign-key relationships
- Conference isolation
- Existing RLS protections
- Existing user access

### Regression Protection

After adding functionality, verify that the relevant Version 1 workflows still operate as before.

A new feature is not complete if it breaks or changes an established Version 1 workflow that was not part of the approved scope.

## 6. Use the Demo Handoff by Default

For work involving rosters, schedules, teams, or payments, use `DEMO_CONFERENCE_HANDOFF.md` as the default source of demo context and data.

Only skip the demo handoff when the user explicitly states that the requested change is not for the demo.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
