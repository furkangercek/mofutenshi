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
7. [ ] **Checkout + payment** — contact/shipping form, flat-rate + free-threshold shipping from settings, provider-agnostic payment interface; gateway integration (iyzico or PayTR — Q2) as the final swap-in; optional manual-payment fallback behind admin toggle; stock decrement on verified `PAID`
8. [ ] **Admin** — products/variants CRUD, tag manager (hierarchical + flat), image upload → R2, sales scheduler, inventory view, orders list + status, settings screen
9. [ ] **SEO + polish** — metadata, structured data (Product/Offer), full-product `sitemap.xml`, robots, empty/error states
10. [ ] **Deploy** — Dockerfile, Coolify on VPS, Cloudflare DNS/CDN/WAF, nightly `pg_dump` → R2 backup job + restore test

## Phase 2

- Transactional emails (Resend + React Email)
- Email verification at registration
- Automatic invoicing (server-side PDF, KDV breakdown line)
- Full order management in admin (status transitions, fulfillment)
- Address book / saved addresses
- Product reviews/ratings
- Automatic Best-Sellers ranking (real order data replaces the manual tag)

## Phase 3+

- Coupon codes, wishlist, multi-admin roles, analytics dashboard, i18n/multi-currency, inventory reservation with timeout, dark theme

## Out of scope (v1)

See PRD §14. Highlights: transactional email, invoicing, coupons, reviews, i18n, returns workflow (policy page only), native app.
