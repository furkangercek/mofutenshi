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
- [x] Automatic invoicing (server-side PDF, KDV breakdown line) — landed 2026-07-06: invoice-styled PDF (R15, not a legal e-Arşiv), pdfkit + embedded Inter, KDV rate setting snapshotted per order (R16); paid-email attachment + account/admin downloads
- [x] Full order management in admin (status transitions, fulfillment) — landed 2026-07-05: PAID→FULFILLED with optional tracking (R13) + shipped email, PAID→CANCELLED with restock (R14, refund manual)
- [x] Address book / saved addresses — landed 2026-07-09: `/account/addresses` CRUD with default flag (max 10), checkout prefill selector + save-at-checkout checkbox (R19: prefill convenience, payment path untouched)
- [x] Product reviews/ratings — landed 2026-07-09: verified-buyer, pre-moderated, 1–5 stars + optional text (R21); PDP section + AggregateRating JSON-LD, admin moderation queue at `/admin/reviews`
- [x] Automatic Best-Sellers ranking (real order data replaces the manual tag) — landed 2026-07-09: units sold last 90 days over PAID/FULFILLED (R20), homepage section + `/best-sellers` derived view, manual tag kept as cold-start filler

## Phase 3+ (started 2026-07-09, R22)

- [x] Coupon codes — landed 2026-07-09: percent-only on top of sale pricing (R23), one per order; window/min/cap/once-per-customer controls; admin CRUD at `/admin/coupons`, checkout apply/remove, invoice iskonto line
- [x] Wishlist / favorites — landed 2026-07-09: logged-in product-level favorites (R24), PDP toggle + `/account/favorites`; no hearts on listing cards (cached surfaces)
- [x] Analytics dashboard — landed 2026-07-11: `/admin/analytics` (nav "Raporlar"), period-scoped (7/30/90 gün) revenue KPIs + SSR SVG daily-revenue chart + top products from order snapshots + status/coupon breakdowns (R25)
- [ ] Multi-admin roles
- [x] Admin new-order notification email (R29.1) — landed 2026-07-12: `EMAIL_ADMIN` env target; fires on havale/EFT placement and verified card payment; nothing on admin manual confirm
- [x] Sentry + Cloudflare Web Analytics (R29.2 — R4 commitment) — landed 2026-07-12: `SENTRY_DSN`-gated server-error reporting via `instrumentation.ts` (envelope API, no SDK); CF Web Analytics = dashboard auto-injection, documented in DEPLOY.md
- [x] Launch-checklist hardening (R29.3) — landed 2026-07-12 in DEPLOY.md: uptime pinger, backup success-ping alerting, prod restore drill schedule, Search Console steps, charged-but-PENDING iyzico reconciliation procedure
- [x] Account deletion + password change (R29.4) — landed 2026-07-12: `/account/security`; password change (current-password gate), self-serve KVKK deletion (orders detach and are retained; admin accounts blocked server-side)
- [x] Inventory reservation with timeout + made-to-order variants — landed 2026-07-11 (R26): per-variant "stok takibi" flag (off = made-to-order, no stock semantics); tracked stock reserved at order creation under row locks (card ~30 min, havale 24 h holds), expiry frees stock lazily
- [ ] i18n / multi-currency
- [ ] Dark theme

## Out of scope (v1)

See PRD §14. Highlights: transactional email, invoicing, coupons, reviews, i18n, returns workflow (policy page only), native app.
