# Status — Session Checkpoint

The single source for "where we are, what's next, what to remember." **AI agents: read this first every session; update it in every commit checkpoint** (state what landed, move the Next Action pointer, prune stale reminders).

**Last updated:** 2026-07-03 (Phase 1 step 6: auth landed)

## Where we are

- **Phase 1 (v1 MVP) is current.** Steps 1 (schema + seed), 2 (tokens + base UI), 3+4 (read path + sales engine), 5 (cart), and 6 (auth) done.
- Schema: `prisma/schema.prisma`, migration `20260702191112_init`, idempotent seed (`npm run db:seed`) with PRD tags + Appendix A/B products + active figures sale + settings singleton.
- Design tokens: Tailwind v4 `@theme` in `src/app/globals.css` — semantic tokens only, default palette disabled (raw `bg-zinc-*` etc. won't compile). Contrast verified (see DESIGN.md).
- Layout shell: sticky translucent header (logo, Radix NavigationMenu tag nav with subtag flyouts, mobile Dialog drawer with Accordion, cart icon), footer, skip link, branded 404/error pages. Turkish copy centralized in `src/lib/copy/common.ts`.
- Motion + placeholder look (owner direction 2026-07-03, recorded in DESIGN.md): all overlays animate open/close (`--animate-*` tokens in globals.css), button press effect, homepage = gradient hero with blurred pastel blobs + staggered entrance + tag tile grid (gradient stand-ins for photos, swap for `next/image` later).
- Fonts via `next/font` (latin-ext): Inter body; **Fraunces display is an INTERIM pick** pending designer.
- **PRD v2.0 is authoritative** — tag-based navigation model, payment in v1.

## NEXT ACTION

**Phase 1, step 7: Checkout + payment.**

- **Gateway = iyzico (R7, 2026-07-03)** — still build the checkout provider-agnostic (payment behind an interface): contact/shipping form (guests by email, logged-in prefilled per PRD US-09), flat-rate + free-threshold shipping from `getSettings()`, order creation with immutable item snapshots, stock decrement ONLY on verified `PAID` callback, optional manual-payment fallback behind the admin toggle.
- Cart re-validation at checkout: hidden cart lines (deactivated variant / unpublished product) must be dropped/re-checked server-side before payment.
- Rate limiting exists (`src/lib/rate-limit.ts`) — reuse for checkout endpoints if needed.
- Use `/feature`, `/frontend`, `/seo` (confirmation page is noindex), `/ui-review` skills.

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

- [x] **Q2 RESOLVED (R7, 2026-07-03): payment gateway = iyzico.** No open decisions remain. Owner still needs an iyzico merchant account + sandbox keys before the gateway goes live.
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
