---
name: test
description: "PLACEHOLDER - no test setup exists yet; tests are planned but deferred. If invoked, explain the status; do not scaffold a test framework without the owner asking."
---

# Test (NOT IMPLEMENTED)

No test framework is set up yet. The owner has explicitly deferred tests - do not add them unprompted, and do not block commits on missing tests.

## Planned direction (fill in when tests land)

- Unit/integration: likely Vitest (+ React Testing Library for components)
- E2E: likely Playwright for the core purchase path (browse -> variant -> cart -> checkout)
- Priority targets once started:
  - Sale price resolution (overlaps, windows, percent vs fixed) - pure logic, highest bug risk
  - Cart rules (stock caps, merge-on-login, one line per variant)
  - Order snapshot immutability
  - zod boundary validation

## TODO when starting

- [ ] Confirm framework choice with owner
- [ ] Add `test` npm script + CI step
- [ ] Rewrite this skill with real commands and conventions
