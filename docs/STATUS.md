# Status — Session Checkpoint

The single source for "where we are, what's next, what to remember." **AI agents: read this first every session; update it in every commit checkpoint** (state what landed, move the Next Action pointer, prune stale reminders).

**Last updated:** 2026-07-05 (Phase 1 step 10: deploy prep landed — provisioning pending owner)

## Where we are

- **Phase 1 (v1 MVP) is current.** Steps 1–9 done: schema + seed, tokens + base UI, read path + sales engine, cart, auth, checkout + payment (**iyzico sandbox-verified E2E 2026-07-05**), admin panel, SEO + polish. One integration remains env-gated until the owner provisions credentials: R2 image uploads.
- Schema: `prisma/schema.prisma`, migrations through `20260703165755`, idempotent seed (`npm run db:seed`).
- **PRD v2.0 is authoritative** — tag-based navigation model, payment in v1.

## NEXT ACTION

**Phase 1, step 10: provisioning day — everything code-side is done and verified locally; all remaining work is blocked on the owner.**

Owner must provide: VPS, domain purchase (reconfirm R8 first), R2 bucket + credentials, iyzico production/sandbox keys, Google OAuth credentials, fresh production `AUTH_SECRET`. **Step-by-step owner guide with alternatives and costs: `docs/LAUNCH_GUIDE.md`** (fastest unblock: iyzico sandbox keys — 10 minutes, verifies the last untested code path). Then follow `docs/DEPLOY.md` top to bottom (Coolify setup → Cloudflare → first-deploy smoke → first backup verification). After deploy, close out the env-gated verification backlog: live R2 upload, iyzico sandbox card flow.

## Step 10 prep notes (landed 2026-07-05)

- **Dockerfile** (multi-stage, `output: "standalone"` added to next.config): deps → builder → runner (non-root `node`, healthcheck on `/robots.txt`). The builder runs `prisma migrate deploy && npm run build` with `DATABASE_URL` as a build ARG — deliberate single-host trade-off (Coolify builds on the VPS where the DB is reachable; migrations therefore must stay backward-compatible for one release). Verified locally: image builds against `host.docker.internal:15432`, serves all key routes, admin leaks nothing to anonymous, and `sharp`/`iyzipay`/`@aws-sdk/client-s3` are traced into the standalone output.
- **Backup job** (`scripts/backup-db.mjs`, baked into the image): `pg_dump -Fc` piped from the DB container into the app container's node; uploads to R2 `backups/`, prunes beyond `BACKUP_KEEP` (14). Pipe mechanics + env-gate verified locally; actual upload untestable until R2 creds exist. **Restore procedure verified**: `-Fc` roundtrip into a scratch DB preserves row counts AND `order_number_seq`.
- **Runbook**: `docs/DEPLOY.md` — Coolify resources + env table, Cloudflare rules (no Rocket Loader; WAF must not challenge the iyzico callback), backup schedule, restore steps, rollback notes, repeatable local image verification. `/deploy` skill now points there.

## Step 9 architecture notes (landed 2026-07-04)

- **Site origin** (`src/lib/site.ts`): `SITE_URL` env, default `https://mofutenshi.com` (R8). Feeds `metadataBase` (root layout, plus site-wide `twitter.card`), `app/sitemap.ts`, `app/robots.ts`.
- **Sitemap** (`app/sitemap.ts`): static pages + all tags + all live products (published + ≥1 active variant, `lastModified`, primary image when R2 is set), via `getSitemapData()` in `catalog.ts` — `"use cache"` tagged `catalog`+`tags`, so admin writes refresh it (5 min revalidate). **Robots** (`app/robots.ts`): disallow `/admin`, `/api/`, `/cart`, `/checkout`, `/account`, `/login`, `/register`, `/search`.
- **Canonicals** are per-page literals (Next has no relative canonical): `/`, `/products`, `/sales`, `/t/[slug]`, `/p/[slug]`, static pages. Filter/sort query params never create indexable duplicates. Private/search pages were already `noindex`.
- **Static pages**: `/about`, `/contact`, `/legal/{terms,privacy,shipping-returns}` render `StaticPage` from `src/lib/copy/static-pages.ts`. **Legal/contact copy is placeholder** (see reminders).
- **Listing perf architecture**: `/products`, `/sales`, `/t/[slug]` render their static frame (h1, chips) in the PPR shell; `ProductListing` now takes the `searchParams` **promise** and only the listing subtree suspends (`ListingContentSkeleton`). Do not await `searchParams` at page level on these routes — it pushes the h1 out of the shell and tanks LCP/CLS.
- **Full prerender of PDP + tag pages**: `generateStaticParams` from `getSitemapData()` (small catalog). Unknown slugs still stream (dynamicParams default). ISR via cache tags keeps them fresh.
- **Hero/LCP rule**: never start an LCP element at `opacity: 0` — the recorded paint waits for the animation. Hero h1 uses transform-only `animate-rise`; keep `animate-fade-up` for subordinate elements.
- Product card title `h3`→`h2` (heading-order a11y); PDP meta description falls back to `siteCopy.description` when the product description is empty; `global-error.tsx` added (branded root-layout failure page, own html/body).
- **Lighthouse (prod build, mobile sim)**: perf 90–92 on home/PDP/products/sales/tag; 100 accessibility/best-practices/SEO on all. LCP ~3.5s everywhere is bound by ~200KB of variable fonts (Inter + Fraunces latin-ext) — revisit when the designer finalizes the display font, not before.
- **PPR `notFound()` 200-status: assessed and kept.** Streams 200 + `noindex` meta; Google honors noindex, and a true 404 would mean dropping PPR on dynamic routes. Revisit only if crawl-budget data says otherwise post-launch.

## Step 8 architecture notes (landed 2026-07-04)

- **Route groups**: storefront chrome (header/footer/cart drawer) moved to `src/app/(storefront)/layout.tsx`; root layout is now bare (html/body/fonts/skip link); `/admin` has its own sidebar layout. URLs unchanged. Storefront 404s keep chrome via `(storefront)/not-found.tsx`; unmatched global URLs use the bare root `not-found.tsx` (shared `NotFoundContent`).
- **Authorization** (`src/lib/admin-guard.ts`): every admin page calls `requireAdmin()` (anonymous → login redirect, non-admin → 404 so the surface stays invisible); every admin server action calls `assertAdmin()` (throws). The layout is chrome only, never the gate. First admin: register normally, then `npm run admin:promote -- <email>` (`scripts/make-admin.ts`), then re-login (role lives in the JWT).
- **Admin reads are always fresh** (`src/lib/queries/admin.ts` — no `"use cache"`). Writes invalidate storefront caches with `updateTag` (read-your-own-writes in server actions; the iyzico callback keeps `revalidateTag(..., "max")` since `updateTag` is action-only): tags → `"tags"`+`"catalog"`; products/sales/inventory/orders(paid) → `"catalog"`; settings → `"settings"`.
- **Product editor** (`src/components/admin/product-form.tsx` + `src/lib/actions/admin-products.ts`): option types/values live in client state; variants are the derived cartesian matrix keyed by option-value combination. Saves send a JSON payload; the server reconciles **by id** — kept variants are updated in place (cart items and order-item links survive price/stock edits), removed combinations are deleted (cart lines cascade; order items SetNull, snapshots intact), new combinations are created. A stale-structure check rejects saves whose ids no longer match the DB. After save the action REDIRECTS (list, or edit page on create) because client-side keys are stale post-save — do not change to an in-place re-render without syncing ids back.
- **P2002 gotcha (Prisma 7 driver adapters)**: `meta.target` is NOT populated on unique violations; the violated field name only appears in `error.message`. `uniqueViolationTarget()` in admin-products handles this (slug vs sku).
- **Images** (`src/lib/r2.ts`, `src/lib/actions/admin-images.ts`): env-gated like iyzico — all five `R2_*` vars (see `.env.example`) must be set or upload UI shows a config note. Upload: zod + type/size checks (jpeg/png/webp/avif ≤10MB), sharp `rotate → resize ≤2000px → webp q82`, key `products/{productId}/{uuid}.webp`, first image becomes primary; alt text (≥3 chars) is REQUIRED at upload. Server-action body limit raised to 10MB (`experimental.serverActions.bodySizeLimit`); `sharp` added to `serverExternalPackages`.
- **Step-3 gotcha FIXED**: `ProductImage` now takes a server-resolved `src` prop; view models (`catalog.ts`, `cart.ts`, PDP metadata) resolve URLs via `imageUrl()` server-side. Client components never read `R2_PUBLIC_URL`.
- **Sales admin**: windows are entered/displayed in Istanbul time and parsed with an explicit `+03:00` offset (`src/lib/datetime.ts`) so schedules are server-TZ-independent. End-early sets `endedEarly` AND clamps `endsAt` to now. Percent 1–99 integer; fixed amounts stored as kuruş.
- **Orders admin**: list + detail render immutable snapshots (survive product deletion — verified). Manual payment confirmation calls **`markOrderPaid()`** with `paymentRef = manual-admin:<adminUserId>` — still the only PENDING_PAYMENT→PAID transition and the only stock decrement. Cancel is a guarded updateMany limited to PENDING_PAYMENT (no restock needed by construction). Action UI disappears once status leaves PENDING_PAYMENT.
- **PPR + admin**: `usePathname` in the nav needed a Suspense boundary in the admin layout (uncached data on dynamic routes fails the build otherwise — `AdminNavFallback` is the static fallback). Admin redirects/404s stream inside a 200 shell like the storefront (verified: anonymous/non-admin responses contain zero admin data).
- Verified over the wire against the prod build (form posts replicating no-JS server actions): role gates (anon redirect, customer 404, forged unauthenticated action rejected), settings save with Turkish money parsing ("79,50"→7950; "1.500" rejected), tag CRUD + two-level hierarchy rules + child-delete block, product create/update/delete with variant-id-preserving reconciliation, duplicate slug/SKU friendly errors, sale price live on PDP (20000→15000) and restored after end-early, inventory inline stock edit, manual order confirm (stock 2→0 exactly once) and cancel, order snapshot after product deletion. **NOT verified: live R2 upload (no credentials) — sharp pipeline itself smoke-tested locally.**

## Step 7 architecture notes (landed 2026-07-03)

- **Order lifecycle**: orders created `PENDING_PAYMENT`, flipped to `PAID` only via `markOrderPaid()` (`src/lib/order-paid.ts`) — guarded updateMany makes replays no-ops; stock decrements exactly once there (clamped at 0 with oversell log). Gateway/init failure → `CANCELLED`.
- **Provider-agnostic boundary** (`src/lib/payments/`): iyzico via hosted CheckoutForm (official SDK; `serverExternalPackages`). Callback (`/api/payments/iyzico/callback`) verifies server-to-server and cross-checks the paid amount; mismatch stays PENDING. `@types/iyzipay` is wrong — we ship `src/types/iyzipay.d.ts`.
- **Checkout math** (`src/lib/checkout.ts`): fresh DB reads; quantity-over-stock aborts with a Turkish "cart changed" error. Flat-rate shipping, waived at the free threshold.
- **Order numbers**: sequence `order_number_seq` → `MT-000001`. **Confirmation access**: HMAC token gates guest access.
- Verified E2E at step 7 (manual path over the wire): snapshots, shipping branches, stock timing, idempotent replay, oversell clamp, forged token rejected. Live iyzico flow sandbox-verified 2026-07-05 (see reminders) — verifyCallback reads the order id from `basketId`, never `conversationId`.

## Step 6 architecture notes (landed 2026-07-03)

- **Auth.js v5 + Prisma adapter, JWT sessions** (`src/lib/auth.ts`); credentials (bcryptjs, dummy-hash timing defense) + Google (hidden until `AUTH_GOOGLE_ID/SECRET`).
- **Session shape**: `session.user.id` + `role` via jwt/session callbacks; augmentation in `src/types/next-auth.d.ts` (augment `@auth/core/jwt`).
- **Cart merge on login** (`src/lib/cart-merge.ts`) in the `signIn` event: transactional, dedupes by variant, caps at min(stock, 99); merge failure never fails login.
- **Server actions** (`src/lib/actions/auth.ts`): zod, Turkish errors, in-memory rate limiting, open-redirect-safe callbackUrl.
- Under cacheComponents a page reading searchParams/session MUST have a Suspense boundary (loading.tsx) or the build fails.

## Step 5 architecture notes (landed 2026-07-03)

- **Guest cart identity**: HMAC-signed httpOnly `mofu_cart` cookie (`src/lib/cart-cookie.ts`); tampered cookies read as empty.
- **Reads**: `getCartView()` per-user, never `"use cache"`, wrapped in React `cache()`. Hidden lines for deactivated variants/unpublished products.
- **Mutations**: server actions with zod; ownership = cart token matches signed cookie; quantities capped at stock and 99; `refresh()` re-renders.
- **UI**: Radix Dialog drawer with server-rendered contents; homepage is ◐ PPR (cart badge is a dynamic hole).

## Step 3+4 architecture notes (landed 2026-07-03)

- **Caching**: Cache Components; catalog `"use cache"` + `cacheTag("catalog")` (5 min), tags hourly, settings hourly (`cacheTag("settings")`).
- **Small-catalog strategy**: `getCatalog()` loads all PUBLISHED products into one snapshot; filter/sort/search in JS (`src/lib/listing.ts`). Revisit past a few thousand.
- **Sales engine** (`src/lib/pricing.ts`): best-price-wins, no stacking; SaleTag on a parent expands to children.
- **Infinite scroll**: server action + IntersectionObserver with SSR `?page=N` fallback. Untested with >24 products.

## Reminders / open items

- [ ] **Legal texts DRAFTED (2026-07-05), not lawyer-reviewed**: full mesafeli satış sözleşmesi + ön bilgilendirme (`src/lib/copy/legal.ts`, drafted against 6502/Yönetmelik incl. the 2026-effective seller-pays-return-shipping rule) and KVKK aydınlatma metni + çerez (`static-pages.ts`). Checkout now REQUIRES consent (checkbox + zod `legalConsent`, wire-verified). Before launch the owner must: fill the `[BRACKETED]` company fields (unvan, adres, vergi, kargo firması), set up the real `destek@` email, and get a lawyer's review — these are drafts, not legal advice.
- [ ] **VPS plan (2026-07-05): owner will likely get SSH access on a friend's VPS.** Caveat flagged: `docs/DEPLOY.md` assumes Coolify, which needs root and owns ports 80/443 via its proxy — not viable on a shared box or a non-root SSH user. Owner should confirm with the friend: root access? anything already on 80/443? If shared, fall back to plain `docker compose` behind the existing reverse proxy (runbook adjustment needed then).
- [ ] **R2 credentials needed from the owner** (Cloudflare account → R2 bucket + API token): set all five `R2_*` vars per `.env.example`, then verify a real upload end-to-end (admin → product edit → Görseller). Also confirm `images.remotePatterns` picks up the public URL after env is set.
- [x] **iyzico sandbox VERIFIED E2E (2026-07-05)** — owner's sandbox keys in local `.env` (gitignored, never commit). Full flow driven with a real browser against the hosted page: init → test card 5528790000000008 → callback → PAID, single stock decrement, idempotent replay, amount cross-check incl. live sale discount. **Found+fixed a real bug**: retrieve echoes the RETRIEVE request's `conversationId` (undefined), not the payment's — order id must come from `basketId`, else successful charges bounce as failures (and the failure branch cancels the order). Production merchant keys still pending owner (needs şahıs şirketi).
- [ ] **Google OAuth credentials pending owner** — button hidden until `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`; callback `<origin>/api/auth/callback/google`.
- [ ] **Local dev DB contains test data from step 8 verification**: users `admin@test.local` (ADMIN) / `customer@test.local` (password `test-password-1`), orders `MT-TEST-1` (PAID) / `MT-TEST-2` (CANCELLED), and settings changed to flat 79,50 TL / threshold 1.500 TL / low-stock 5 / manual payment ON with placeholder instructions. Owner: replace instructions with real bank details or disable before launch; re-run `npm run db:seed` any time (idempotent, restores seed sales).
- [ ] Admin delete/confirm dialogs use native `window.confirm` — pragmatic for v1 desktop-first admin; swap for Radix AlertDialog if the owner wants the animated overlay treatment in admin too.
- [ ] CI: confirm green after next push (postgres service fix landed 2026-07-03; step 8 adds no build-time DB reads beyond existing patterns).
- [x] Step 10 deploy prep done — build-time DB requirement is handled inside the Dockerfile (`migrate deploy` before `next build`); env provisioning on Coolify documented in `docs/DEPLOY.md`.
- [ ] Designer input pending: display font choice (Fraunces interim; must cover latin-ext).
- [ ] Custom loader animation pending owner: the site loader is a placeholder spinning ring — swap ONLY the marked inner span in `src/components/ui/loader.tsx` (Loader is reused by the boot splash, LoaderOverlay dimmer, and checkout pending state). Boot splash is pure CSS (600ms hold + 300ms fade), never blocks input, skipped under reduced motion; verified Lighthouse-neutral (home perf 92).
- [x] **Production domain RESOLVED (R8, 2026-07-04): `mofutenshi.com`** (working decision — owner said "probably"; reconfirm before purchase/DNS). Unblocks step 9 `metadataBase`/canonicals/OG.
- [ ] R5: `garage-kits` is a manual subtag — owner flags if upkeep gets annoying.
- [ ] Seed image keys (`seed/*.jpg`) are placeholders; with R2 unset all product images render the gradient placeholder (and the sitemap/OG omit images).
- [x] Under PPR, `notFound()` streams a 200 with noindex meta — assessed at step 9 and kept (see step 9 notes).
- [x] Step 9 SEO backlog done: sitemap.xml, robots.txt, canonicals + metadataBase, Lighthouse pass, static pages.

## Local environment

- Postgres: `npm run db:up` (postgres:17-alpine, container `mofutenshi-db-1`). **Start Docker Desktop first** — it does not auto-start on this machine.
- **Host port is 15432** (WinNAT reserved-range workaround, 2026-07-03). If a bind fails, check `netsh interface ipv4 show excludedportrange protocol=tcp`.
- `.env` exists locally (gitignored); values match `.env.example`.
- Prisma 7.8: config in `prisma.config.ts` (dotenv required), client generated into `src/generated/prisma`, driver adapter `@prisma/adapter-pg`, singleton `src/lib/prisma.ts`. **Driver-adapter P2002 errors omit `meta.target`** — parse the message (see step 8 notes).
- Next.js 16.2: read `node_modules/next/dist/docs/` before writing app code (APIs differ from training data — see AGENTS.md).
- First admin user: `npm run admin:promote -- <email>` after registering via `/register`.

## Machine/tooling gotchas (Windows, this machine)

- `npx <pkg>@<version>` fails in Git Bash here — use `npm exec -- <pkg>` instead.
- After a schema change, run `npx prisma generate` explicitly and REBUILD before trusting a running server (stale client → P2022).
- `rm -rf` style deletions may be permission-denied for the agent — move files aside instead (worked for stale `.next/dev/types` after the route-group restructure; delete that dir whenever moved routes leave stale generated types behind).
- Commands are proxied through `rtk`; output can look filtered/abbreviated. Long-running servers: use `rtk proxy npm run start` to get unbuffered logs; multiline inline `-e` scripts fail under rtk — write a script file instead.
- **2026-07-03 incident**: a leftover Claude Code daemon auto-resumed an old transcript and edited the repo concurrently. If files change mid-session, run `tasklist | grep claude` before blaming the formatter.

## Working conventions recap

- Agent may commit at agreed checkpoints; **NEVER push** — owner pushes manually.
- Conventional commit format; ≤50-char imperative subject.
- Every checkpoint commit also updates: ROADMAP checkboxes + this file.
- Never resolve an open decision silently — ask the owner, record via `/decision`.
