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

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
