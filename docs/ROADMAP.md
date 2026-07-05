# Roadmap

Build order for v1 (per PRD v2), then phases. Checkboxes track actual progress — keep them updated as work lands.

## Phase 0 — Foundation (complete)

- [x] PRD + docs structure + CLAUDE.md
- [x] Next.js boilerplate (App Router, TypeScript, Tailwind)
- [x] Linters, Prettier, editor config
- [x] AI skills/commands for the workflow
- [x] Docker compose for local Postgres; Prisma init
- [x] CI basics (typecheck, lint, build)

## Phase 1 — v1 MVP (current)

Build order chosen so each step is testable against real data:

1. [x] **Schema + seed** — full Prisma schema (see DATA_MODEL.md: tags, products, variants, sales, cart, orders, settings), first migration, seed script with the PRD seed tags and sample products/variants
2. [x] **Design tokens + base UI** — Tailwind token mapping (PRD §8.1 palette), layout shell, typography
3. [x] **Storefront read path** — homepage sections (Sales/New/Best Sellers/Featured), tag pages `/t/[slug]` (parent includes children), `/sales` view, `/products` PLP with filters + infinite scroll (+ SEO fallback), PDP with variant selection, search
4. [x] **Sales engine** — effective-price resolution (best price wins, no stacking), badges, `/sales` auto-population (landed with step 3 — the read path needed it)
5. [x] **Cart** — guest signed-cookie cart, drawer + cart page, quantity/stock rules, live effective pricing
6. [x] **Auth** — Auth.js, register/login, social provider (Google, pending OAuth creds), cart merge on login
7. [x] **Checkout + payment** — contact/shipping form, flat-rate + free-threshold shipping from settings, provider-agnostic payment interface; iyzico gateway integration (R7, sandbox-verified E2E 2026-07-05); manual-payment fallback behind admin toggle; stock decrement on verified `PAID`
8. [x] **Admin** — products/variants CRUD, tag manager (hierarchical + flat), image upload → R2 (code-complete; live upload pending owner's R2 credentials), sales scheduler, inventory view, orders list + status + manual payment confirm/cancel, settings screen
9. [x] **SEO + polish** — metadata, structured data (Product/Offer), full-product `sitemap.xml`, robots, canonical URLs, static pages (`/about`, `/contact`, `/legal/*` — placeholder copy pending owner), empty/error states, Lighthouse pass (≥90 perf, 100 SEO/a11y on key pages)
10. [ ] **Deploy** — Dockerfile, Coolify on VPS, Cloudflare DNS/CDN/WAF, nightly `pg_dump` → R2 backup job + restore test (code-side prep landed 2026-07-05: Dockerfile + backup uploader + `docs/DEPLOY.md` runbook, image and restore verified locally; remaining work is blocked on owner provisioning VPS/domain/credentials)

## Phase 2 (started 2026-07-05, R9)

- [x] Transactional emails (Resend, React templates) — landed 2026-07-05: order-received (manual payment, with instructions) + payment-confirmed on PAID, env-gated until the owner provisions Resend; the shipping email lands with the fulfillment transition in order management
- [x] Email verification at registration (R11: blocks credentials login until verified, env-gated) — landed 2026-07-05
- [x] Password reset via emailed link (R12, bundled with verification) — landed 2026-07-05
- [ ] Automatic invoicing (server-side PDF, KDV breakdown line)
- [x] Full order management in admin (status transitions, fulfillment) — landed 2026-07-05: PAID→FULFILLED with optional tracking (R13) + shipped email, PAID→CANCELLED with restock (R14, refund manual)
- [ ] Address book / saved addresses
- [ ] Product reviews/ratings
- [ ] Automatic Best-Sellers ranking (real order data replaces the manual tag)

## Phase 3+

- Coupon codes, wishlist, multi-admin roles, analytics dashboard, i18n/multi-currency, inventory reservation with timeout, dark theme

## Out of scope (v1)

See PRD §14. Highlights: transactional email, invoicing, coupons, reviews, i18n, returns workflow (policy page only), native app.
