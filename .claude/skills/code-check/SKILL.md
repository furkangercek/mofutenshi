---
name: code-check
description: Quality gate - run lint/typecheck/format, then review the diff for dead code, unnecessarily long code, and duplication. Use before every commit that touches src/, and whenever the owner asks for a code health check. Usage - /code-check [optional scope, defaults to working diff].
---

# Code check

Two layers: mechanical checks first, then a review pass the tools cannot do.

## 1. Mechanical

```
npm run check        # eslint + tsc --noEmit + prettier --check
```

If routing/config/server-client boundaries changed, also `npm run build`. Fix failures before the review pass.

## 2. Review pass

Scope: `git diff` (staged + unstaged) by default, or the files the owner names. Look for:

**Dead code**

- Unused exports, variables, props, imports (eslint catches some; check exports manually)
- Unreachable branches, always-true/false conditions
- Commented-out code blocks - delete them, git remembers
- Leftover console.log / debug artifacts
- Components or utils no longer referenced anywhere

**Unnecessarily long code**

- Functions/components beyond ~60 lines - can they split along clear seams? (Do not split for its own sake; only where a seam is real.)
- Deeply nested conditionals that flatten with early returns
- Duplicated logic that belongs in one util/hook
- Client components that could be server components ("use client" audit)
- Hand-rolled logic that Radix/Next.js/std-lib already provides

**Project-specific smells**

- Floats or arithmetic on money (must be integer minor units)
- Sale/discount prices stored instead of computed
- Raw hex colors in components instead of semantic tokens
- Missing zod validation on a new mutation boundary
- Missing server-side auth check on admin/account mutations

## 3. Report

Rank findings by severity, with `file:line` references. Apply fixes for clear-cut items; ask before restructuring anything substantial. State plainly if the check is clean.

> NOTE (fill in later): consider adding `knip` for automated unused-export/file detection once the codebase is big enough to warrant it.
