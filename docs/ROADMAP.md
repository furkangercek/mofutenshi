# Roadmap

Build order for v1, then phases. Checkboxes track actual progress — keep them updated as work lands.

## Phase 0 — Foundation (current)

- [x] PRD + docs structure + CLAUDE.md
- [x] Next.js boilerplate (App Router, TypeScript, Tailwind)
- [x] Linters, Prettier, editor config
- [x] AI skills/commands for the workflow
- [ ] Docker compose for local Postgres; Prisma init
- [ ] CI basics (typecheck, lint, build)

## Phase 1 — v1 MVP

Build order chosen so each step is testable against real data:

1. **Schema + seed** — full Prisma schema (see DATA_MODEL.md), seed script with sample categories/products/variants
2. **Design tokens + base UI** — Tailwind token mapping, layout shell, typography
3. **Storefront read path** — homepage sections, category PLP, PDP with variant selection, search
4. **Sales engine** — Sale model + effective-price resolution + badges
5. **Cart** — guest cookie cart, drawer, quantity/stock rules
6. **Auth** — Auth.js, register/login, cart merge on login
7. **Checkout (order capture)** — pending Q1; assume manual-payment `PENDING_PAYMENT` orders
8. **Admin** — products/variants CRUD, image upload → R2, categories, sales scheduler, inventory
9. **SEO + polish** — metadata, structured data, sitemap, empty/error states
10. **Deploy** — Dockerfile, Coolify on VPS, Cloudflare, backups (Q13)

## Phase 2

- Payment gateway (iyzico or PayTR — Q2)
- Transactional emails (Resend + React Email)
- Automatic invoicing (server-side PDF)
- Full order management in admin (status transitions, fulfillment)
- Address book; email verification (Q11)
- Product reviews

## Phase 3+

- Coupon codes, wishlist, multi-admin roles, analytics dashboard, i18n/multi-currency, inventory reservation, dark theme

## Out of scope (v1)

See PRD §15. Highlights: real payment processing, transactional email, invoicing, coupons, reviews, i18n, native app.
