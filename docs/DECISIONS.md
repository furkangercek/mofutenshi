# Decisions Log

Two sections: **Resolved** (append-only, newest first) and **Open** (from PRD §13–14). When an open question gets answered, move it to Resolved with the date and rationale. AI agents: never silently resolve an open question — ask the owner, then record here.

## Resolved

| # | Date | Decision | Rationale |
|---|---|---|---|
| R1 | 2026-07-02 | Repo: public GitHub `furkangercek/mofutenshi`, SSH via `github.com-personal` alias, personal git identity | Owner has separate work/personal GitHub accounts; MCP connector authed as personal |
| R2 | 2026-07-02 | Docs live in `docs/`, PRD is requirements source of truth | AI-first workflow needs stable references |

## Open (answer before the feature that needs it)

| # | Question | Blocks | Leaning |
|---|---|---|---|
| Q1 | v1 checkout: manual-payment order capture, or block v1 on iyzico/PayTR? | Checkout, orders, inventory decrement | PRD assumes manual-payment capture (`PENDING_PAYMENT`) |
| Q2 | Payment gateway: iyzico or PayTR? | Phase 2 | — |
| Q3 | Overlapping sales rule | Sale pricing logic | Best price for customer wins |
| Q4 | Cart price: live until checkout vs. locked at add | Cart | Live until checkout |
| Q5 | Inventory decrement: on order create vs. payment confirm | Orders | On order create (coupled to Q1) |
| Q6 | PLP: pagination vs. infinite scroll | PLP | — |
| Q7 | Currency + tax/VAT (KDV?) handling | Pricing, checkout | Assume TRY, single currency |
| Q8 | Shipping: flat / per-region / free-over-threshold / manual | Checkout totals | — |
| Q9 | Accent + ink colors (palette lacks both) | All UI | Ink ~#2A2A38 placeholder; accent TBD |
| Q10 | Guest checkout allowed? | Checkout | Yes |
| Q11 | Email verification at register, or Phase 2? | Auth | Defer to Phase 2 |
| Q12 | Analytics + error tracking tools | Ops | Cloudflare Web Analytics + Sentry free tier |
| Q13 | Postgres/R2 backup destination + frequency | Launch readiness | Off-VPS nightly dump; needed before launch |
| Q14 | Returns/refunds: policy copy only in v1? | Legal pages | Policy copy only |
| Q15 | Multi-category products needed? | Schema (join table vs. FK) | Single primary category |
