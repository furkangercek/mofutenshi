---
name: decision
description: Record a resolved decision in docs/DECISIONS.md. Use IMMEDIATELY whenever the owner answers an open question (Q1-Q15) or makes any new product/technical decision in conversation - do not wait to be asked. Usage - /decision <question or Q#> <answer/rationale>.
---

# Record a decision

Keep `docs/DECISIONS.md` as the single decision log. Never let a decision live only in chat history.

## Steps

1. Read `docs/DECISIONS.md`.
2. If the decision answers an existing open question (Q#):
   - Remove that row from the **Open** table.
   - Add a row to the **Resolved** table: next `R#`, today's date, the decision, the rationale given by the owner (ask if none was given).
3. If it is a new decision not in the Open table, append it to **Resolved** directly.
4. Propagate: if the decision invalidates statements in `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, or `docs/DESIGN.md`, update those files in the same change and mention it.
5. If code already exists that contradicts the decision, flag it to the owner - do not silently refactor.
6. Commit: `docs(decisions): resolve Q# <short subject>` (or `record <subject>` for new decisions).

## Rules

- Never resolve an open question yourself. Only the owner resolves; you record.
- One decision per Resolved row. Keep rationale to one sentence.
- Do not renumber existing R# / Q# entries.
