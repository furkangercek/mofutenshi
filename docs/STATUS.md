# Status — Session Checkpoint

The single source for "where we are, what's next, what to remember." **AI agents: read this first every session; update it in every commit checkpoint** (state what landed, move the Next Action pointer, prune stale reminders).

**Last updated:** 2026-07-03 (Phase 1 step 7: checkout + payment landed)

## Where we are

- **Phase 1 (v1 MVP) is current.** Steps 1 (schema + seed), 2 (tokens + base UI), 3+4 (read path + sales engine), 5 (cart), 6 (auth), and 7 (checkout + payment) done — the iyzico card path is code-complete but unverified until the owner has sandbox keys.
- Schema: `prisma/schema.prisma`, migration `20260702191112_init`, idempotent seed (`npm run db:seed`) with PRD tags + Appendix A/B products + active figures sale + settings singleton.
- Design tokens: Tailwind v4 `@theme` in `src/app/globals.css` — semantic tokens only, default palette disabled (raw `bg-zinc-*` etc. won't compile). Contrast verified (see DESIGN.md).
- Layout shell: sticky translucent header (logo, Radix NavigationMenu tag nav with subtag flyouts, mobile Dialog drawer with Accordion, cart icon), footer, skip link, branded 404/error pages. Turkish copy centralized in `src/lib/copy/common.ts`.
- Motion + placeholder look (owner direction 2026-07-03, recorded in DESIGN.md): all overlays animate open/close (`--animate-*` tokens in globals.css), button press effect, homepage = gradient hero with blurred pastel blobs + staggered entrance + tag tile grid (gradient stand-ins for photos, swap for `next/image` later).
- Fonts via `next/font` (latin-ext): Inter body; **Fraunces display is an INTERIM pick** pending designer.
- **PRD v2.0 is authoritative** — tag-based navigation model, payment in v1.

## NEXT ACTION

**Phase 1, step 8: Admin.**

- Products/variants CRUD, tag manager (hierarchical + flat), image upload → R2 (sharp on upload), sales scheduler, inventory view, orders list + status, settings screen.
- **Authorization**: `/admin/*` requires the `ADMIN` role server-side on every page AND mutation (`session.user.role` is already in the JWT). No admin user exists yet — add a seed/promote path.
- **Manual order confirmation must reuse `markOrderPaid`** (`src/lib/order-paid.ts`) — it is the single PENDING→PAID transition and the only place stock decrements.
- **Admin writes must revalidate caches**: `revalidateTag("catalog"/"tags"/"settings", "max")` after each relevant mutation (see step 3+4 notes).
- **Step 8 gotcha (from step 3)**: `imageUrl()` reads server-only `R2_PUBLIC_URL` — resolve image URLs server-side into view models before R2 goes live (see reminder below).
- Use `/feature`, `/frontend`, `/ui-review` skills. Admin is desktop-first acceptable (PRD §8).

## Step 7 architecture notes (landed 2026-07-03)

- **Order lifecycle**: order rows are created `PENDING_PAYMENT` up front (stable id for the gateway `conversationId`), flipped to `PAID` only via `markOrderPaid()` (`src/lib/order-paid.ts`) — a guarded `updateMany` makes replays no-ops; stock decrements exactly once there (clamped at 0 with an oversell log; reservation is Phase 3). Gateway failure callback → `CANCELLED`; init failure → `CANCELLED`; abandoned card orders linger `PENDING_PAYMENT` (admin can cancel at step 8).
- **Provider-agnostic boundary** (`src/lib/payments/`): `PaymentGateway` interface with iyzico as sole implementation (official `iyzipay` SDK, hosted CheckoutForm — no card data touches us; `serverExternalPackages: ["iyzipay"]` because the SDK self-assembles via dynamic require). Callback route (`/api/payments/iyzico/callback`) verifies server-to-server via `checkoutForm.retrieve` and cross-checks the paid amount against the order before flipping; a mismatch stays PENDING for manual review. `@types/iyzipay` is WRONG (demands paymentCard, omits paymentPageUrl) — we ship our own minimal `src/types/iyzipay.d.ts`.
- **Checkout math** (`src/lib/checkout.ts`): reads FRESH DB state (never "use cache") — visibility rules match the cart view; quantity-over-stock aborts with a Turkish "cart changed" error instead of silently capping money. Shipping: flat rate, waived at the free threshold, from the settings row read fresh.
- **Order numbers**: Postgres sequence `order_number_seq` → `MT-000001` (gaps are fine).
- **Confirmation access**: `/checkout/confirmation?order=<id>&token=<hmac>` — HMAC (AUTH_SECRET) gates guest access; sequential order numbers never authorize reads.
- **Manual fallback**: order stays PENDING_PAYMENT, confirmation shows `manualPaymentInstructions` (or a fallback line); cart cleared on placement. Card path clears the cart only on verified PAID.
- **Account**: `/account` now lists the user's orders (number, date, status, total).
- Verified E2E against the prod build (manual path over the wire; `markOrderPaid` exercised directly): sale-priced immutable snapshots, both shipping branches, stock untouched while PENDING, decrement exactly once on PAID, idempotent replay, oversell clamp, forged confirmation token rejected, over-stock cart rejected, account listing. **NOT verified: the live iyzico flow (no sandbox keys yet)** — form posts to iyzico, 3DS, and the real callback need a merchant account.

## Step 6 architecture notes (landed 2026-07-03)

- **Auth.js v5 (next-auth beta.31) + Prisma adapter, JWT sessions** (`src/lib/auth.ts`) — JWT strategy is required for the credentials provider; the adapter still persists users/OAuth accounts. `User.emailVerifiedAt` was renamed `emailVerified` (migration `20260703165755`) to match the stock adapter.
- **Providers**: credentials (bcryptjs, cost 10, dummy-hash compare against user enumeration timing) + Google, which stays hidden until `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` are set (owner must provision OAuth creds; `.env.example` documents it).
- **Session shape**: `session.user.id` + `role` via jwt/session callbacks; type augmentation in `src/types/next-auth.d.ts` (augment `@auth/core/jwt`, not `next-auth/jwt` — the interface lives there).
- **Cart merge on login** (`src/lib/cart-merge.ts`) runs in the Auth.js `signIn` EVENT, so it covers credentials and OAuth paths with one code path; transactional, dedupes by variant, caps at min(stock, 99), deletes guest cart + clears cookie. A merge failure logs but never fails the login.
- **Cart identity** (`src/lib/cart-identity.ts`): session userId first, else signed guest cookie; `getCartView` and all cart-action ownership checks resolve through it.
- **Server actions** (`src/lib/actions/auth.ts`): register/login/logout/Google with zod, Turkish errors from `src/lib/copy/auth.ts`, in-memory fixed-window rate limiting (`src/lib/rate-limit.ts` — per-instance; Cloudflare edge layer arrives at step 10), open-redirect-safe `callbackUrl` (`src/lib/callback-url.ts`).
- **UI**: `/login` + `/register` share `AuthPage` (noindex, PPR with loading.tsx skeletons — under cacheComponents a page reading searchParams/session MUST have a Suspense boundary or the build fails), `/account` shell redirects anonymous users to `/login?callbackUrl=…`, header account icon is a Suspense hole like the cart badge.
- Verified over the wire against the prod build (progressive-enhancement form posts, no JS): register → 303 + session + bcrypt hash in DB; duplicate email rejected; wrong password rejected; guest cart (qty 3) + user cart (qty 4) merged to stock cap 3 with guest cart deleted + cookie cleared; merged badge renders for the session; logout clears session; 11 bad logins trip the rate limit; tampered cart cookie still reads as empty.

## Step 5 architecture notes (landed 2026-07-03)

- **Guest cart identity**: HMAC-signed random token in an httpOnly `mofu_cart` cookie (`src/lib/cart-cookie.ts`, signed with `AUTH_SECRET`), token stored on `Cart.sessionToken`. Tampered/forged cookies fail verification and read as an empty cart.
- **Reads**: `getCartView()` (`src/lib/queries/cart.ts`) is per-user and NEVER `"use cache"`; wrapped in React `cache()` so the header badge and drawer share one DB read per request. Live effective pricing reuses `loadActiveSales` + `resolveEffectivePrice`. Lines with deactivated variants/unpublished products are hidden (checkout re-validates at step 7).
- **Mutations**: server actions (`src/lib/actions/cart.ts`) with zod; ownership check = the item's cart token must match the request's signed cookie; quantities capped at stock and 99; `refresh()` re-renders the route so drawer/badge update in the same roundtrip.
- **UI**: drawer is a Radix Dialog shell (`cart-drawer.tsx`) whose contents are server-rendered and passed in as children; `CartUIProvider` holds open state; PDP add-to-cart opens the drawer as the confirmation (PRD US-07). `/cart` mirrors it with `robots: noindex`.
- **Build shape change**: the homepage is now ◐ PPR (was ○ fully static) — the cart badge/drawer is a dynamic Suspense hole in the layout. Shells remain static; expected and correct.
- Verified over the wire against the prod server: add → signed cookie + line at ₺24,65 (sale-aware), stock cap (requested 99 → stored 5, `capped: true`), out-of-stock add rejected, quantity update, tampered-cookie and cookie-less mutations rejected, remove → branded empty state.

## Step 3+4 architecture notes (landed 2026-07-03)

- **Caching**: Cache Components enabled (`cacheComponents: true`). Catalog queries are `"use cache"` + `cacheTag("catalog")` / `cacheTag("tags")`; catalog revalidates every 5 min (bounds sale-window staleness), tags hourly; shipping settings under `cacheTag("settings")` (hourly, `src/lib/queries/settings.ts`). Admin writes (step 8) must call `revalidateTag`/`updateTag` for all three tags. Homepage fully static (5m revalidate); listings/PDP are Partial Prerender.
- **Small-catalog strategy**: `getCatalog()` loads all PUBLISHED products into one cached snapshot; filter/sort/search/pagination run in JS (`src/lib/listing.ts`). Revisit if catalog grows past a few thousand.
- **Sales engine** (`src/lib/pricing.ts`): best-price-wins, no stacking; SaleTag on a parent tag expands to child tags. Verified against seed: ₺29,00 → ₺24,65 on PDP, both products in `/sales`.
- **Infinite scroll**: server action `loadMoreCards` + IntersectionObserver; SSR HTML has a real `?page=N` link until JS mounts (crawlable). Untested with >24 products (seed has 2).

## Reminders / open items

- [x] **Q2 RESOLVED (R7, 2026-07-03): payment gateway = iyzico.** No open decisions remain.
- [ ] **iyzico merchant account + sandbox keys needed from the owner** to verify the card path end-to-end (set `IYZICO_API_KEY`/`IYZICO_SECRET_KEY`; the card option appears automatically). Register the callback origin; callback path is `/api/payments/iyzico/callback`. Until then the card option is hidden and manual payment carries orders.
- [ ] **Local DB has `manualPaymentEnabled: true` with PLACEHOLDER IBAN instructions** (set 2026-07-03 for checkout testing; not part of the seed). Owner: replace with real bank details in admin (step 8) before launch or disable the toggle.
- [ ] Abandoned card-payment orders linger as `PENDING_PAYMENT` (provider `iyzico`) — admin orders view (step 8) should surface/cancel them.
- [ ] **Google OAuth credentials pending owner** — the Google login button stays hidden until `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` exist; US-10 "at least one social provider" is code-complete but not user-visible until then. Callback URL to register in Google Console: `<origin>/api/auth/callback/google`.
- [ ] CI was RED (build prerender needs Postgres; runner had none). Fixed 2026-07-03: workflow now runs a postgres:17 service + `prisma migrate deploy` before build; verified locally against an empty DB. Confirm green after next push.
- [ ] Same constraint applies to the step 10 deploy: the production Docker build needs a reachable, migrated database at `next build` time (Coolify build-time env/network) — plan for it.
- [ ] Designer input pending: display font choice (Fraunces is interim; must cover Turkish glyphs / latin-ext). Contrast question RESOLVED: black on `#B6BFF2` = 11.72:1, passes — recorded in DESIGN.md.
- [ ] Production domain not decided — blocks `metadataBase`/canonical URLs/OG images (needed by step 9 SEO at the latest).
- [ ] R5: `garage-kits` is a manual subtag — owner should flag if tagging upkeep gets annoying (would become a derived view).
- [ ] Seed image keys (`seed/*.jpg`) are placeholders; `R2_PUBLIC_URL` unset → all product images render the gradient placeholder (`product-image.tsx`). Becomes real at step 8 (image upload).
- [ ] **Step 8 gotcha**: `imageUrl()` reads `R2_PUBLIC_URL`, which is server-only — `ProductImage` instances inside client components (PDP gallery, cart panel) would silently fall back to the gradient once R2 is live. Fix at step 8 by resolving image URLs server-side into the view models (do NOT just rename to `NEXT_PUBLIC_`, decide deliberately).
- [ ] Under PPR, `notFound()` on dynamic routes streams a 200 with `noindex` meta (not a true 404 status). Revisit at step 9 if a true 404 status matters; branded UI + noindex is the current behavior.
- [ ] Step 9 SEO backlog: sitemap.xml, robots.txt, canonical URLs (blocked on domain), Lighthouse pass.

## Local environment

- Postgres: `npm run db:up` (compose service `db`, postgres:17-alpine, container `mofutenshi-db-1`). **Start Docker Desktop first** — it does not auto-start on this machine.
- **Host port is 15432** (2026-07-03): Windows WinNAT reserved an excluded range covering 5432 after a reboot and silently blocked the bind ("access permissions" error on `docker compose up`). Compose now maps `15432:5432`; `.env`/`.env.example` updated. If a port bind fails again, check `netsh interface ipv4 show excludedportrange protocol=tcp`; the permanent fix (`net stop winnat` + persistent exclusion) needs an elevated shell the agent doesn't have.
- `.env` exists locally (gitignored); values match `.env.example`.
- Prisma 7.8 specifics: config in `prisma.config.ts` (needs dotenv, no auto-.env-loading), client generated into `src/generated/prisma` (gitignored, regenerated by `postinstall`), driver adapter `@prisma/adapter-pg`, app singleton `src/lib/prisma.ts`.
- Next.js 16.2: read `node_modules/next/dist/docs/` before writing app code (APIs differ from training data — see AGENTS.md).

## Machine/tooling gotchas (Windows, this machine)

- `npx <pkg>@<version>` fails in Git Bash here — use `npm exec -- <pkg>` instead.
- After a schema change, run `npx prisma generate` explicitly and REBUILD before trusting a running server — a stale generated client caused P2022 (column does not exist) during step 6 verification even though `migrate dev` had run.
- `rm -rf` style deletions may be permission-denied for the agent — prefer moving files aside, or ask the owner.
- Commands are proxied through `rtk`; output can look filtered/abbreviated.
- **2026-07-03 incident**: a leftover Claude Code daemon auto-resumed the previous session's transcript in the background (permissions bypassed) and wrote step 5 concurrently with the interactive session. If files change mid-session or edits fail with "modified since read", run `tasklist | grep claude` and check for stray daemon/fork processes before blaming the formatter.

## Working conventions recap

- Agent may commit at agreed checkpoints; **NEVER push** — owner pushes manually.
- Conventional commit format; ≤50-char imperative subject.
- Every checkpoint commit also updates: ROADMAP checkboxes + this file.
- Never resolve an open decision silently — ask the owner, record via `/decision`.
