---
name: feature
description: Standard workflow for implementing any roadmap feature (schema, storefront, cart, auth, admin, etc.). Use whenever starting feature work on this project, even if the owner just says "build X" without naming this skill. Usage - /feature <feature name or roadmap item>.
---

# Feature workflow

Every feature follows the same discipline so sessions are consistent and nothing bypasses the docs.

## Before writing code

1. Read the relevant `docs/PRD.md` section (user stories + acceptance criteria) and `docs/DATA_MODEL.md` invariants.
2. Read `docs/DECISIONS.md`. If an **open question blocks this feature** (the "Blocks" column names it), STOP and ask the owner. Record the answer with `/decision` before proceeding.
3. Check `docs/ROADMAP.md` build order - flag if this feature is being built out of order and a dependency is missing (e.g., cart before schema).
4. State a short plan (files, approach). For schema changes, plan the Prisma migration.

## While implementing

- Follow CLAUDE.md hard rules (integer money, computed sale prices, snapshot order items, server-side auth checks, zod at boundaries, SSR-first).
- Next.js 16: consult `node_modules/next/dist/docs/` for current APIs - do not trust training-data conventions.
- Prefer server components; smallest possible client islands.

## Before committing

1. Run `npm run check` (lint + typecheck + format). Fix everything.
2. Run `npm run build` if routing, config, or server/client boundaries changed.
3. If UI was touched, run the `/ui-review` checklist.
4. Run the `/code-check` review on the diff.
5. Update `docs/ROADMAP.md` checkboxes for what actually landed.
6. Commit at the agreed checkpoint (conventional format). NEVER push - the owner pushes.

## Acceptance

A feature is done when its PRD acceptance criteria pass, not when it compiles. Say plainly which criteria are verified and which are not.
