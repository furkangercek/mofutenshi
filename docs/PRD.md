# MofuTenshi — Product Requirements Document (PRD)

**Version:** 2.0 (Final — all open questions resolved)
**Owner:** Product
**Status:** Ready for implementation
**Last updated:** 2026-07-02

---

## 0. How to read this document

This PRD is written to be handed to **an LLM/AI coding agent as the implementer** — not a team of human engineers. This matters for how the document is structured: requirements are explicit, self-contained, and testable; assumptions are stated rather than left implicit; and business logic (pricing, tags, sales) is spelled out step by step so the implementing model does not have to guess. The implementer should treat the decisions in this document as settled and ask for clarification only where a `NOTE:` explicitly defers a choice.

A blunt framing note: building a custom storefront on Next.js is meaningfully more effort than configuring Shopify. For a single-brand catalog that trade-off pays off only if you value design control, low recurring cost, and owning the data — all three are stated priorities here, so this PRD does not re-argue the decision.

All prior "OPEN" questions from v1 have been resolved and folded into the relevant sections. The category model from v1 has been **replaced by a tag-based navigation model** (Section 3 and Section 6).

---

## 1. Product vision, goals, and target users

### 1.1 Vision

MofuTenshi is a personal, art-forward e-commerce site for a single brand selling physical art products (figures, handcrafts, art prints, stickers, and more). It is a lightweight, self-hosted alternative to Shopify — the storefront itself should feel like a curated art object, not a template. Cost efficiency and design ownership are first-class priorities.

### 1.2 Goals

| Goal                     | Description                                                                                  | Measure (see Section 11)                             |
| ------------------------ | -------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| G1 — Sell products       | Convert visitors into buyers with a frictionless, variant-aware browse-to-checkout flow      | Conversion rate, cart abandonment                    |
| G2 — Distinctive brand   | Deliver an art-forward aesthetic that differentiates from generic stores                     | Qualitative design review, bounce rate, time on site |
| G3 — Low operating cost  | Run on a self-hosted VPS with free-tier services wherever viable                             | Monthly infra cost                                   |
| G4 — Owner autonomy      | Let the store owner manage catalog, variants, tags, sales, and inventory without a developer | Admin task completion without engineering            |
| G5 — Fast + discoverable | Fast loads and good SEO via SSR                                                              | LCP, Lighthouse, organic traffic                     |

### 1.3 Non-goals for v1

Marketplace/multi-vendor, subscriptions, digital-goods delivery, marketing automation, and a native mobile app are explicitly out of scope (Section 14).

### 1.4 Target users

- **Shopper (primary).** Browses art products, compares variants (e.g., painted vs. unpainted figures), buys. Values visual browsing, clear pricing, and trust. Likely arrives from social (Instagram/X), so mobile-first matters.
- **Store owner / admin (primary).** Non-developer or semi-technical. Uploads products, sets variants/prices, applies tags, runs sales, tracks inventory. Needs a fast, forgiving admin UI.
- **Returning customer (secondary).** Has an account, wants order history and faster checkout.

`ASSUMPTION:` Single admin user for v1; no role hierarchy. Multi-admin/roles is roadmap.

---

## 2. Feature list — v1 (MVP) vs. later phases

### 2.1 v1 (MVP)

**Storefront**

- Homepage with large, prominent Sales, New Arrivals, and Featured/Best-Seller sections
- Tag-based browsing across many product types (see Section 3)
- Product listing pages (PLP) with filtering, sorting, and **infinite scroll**
- Product detail pages (PDP) with variant selection and per-variant price/stock
- Sale badges and strikethrough pricing wherever a product/variant is on sale
- Search (basic, by name/description)

**Cart**

- Add / remove / update quantity, variant-aware
- Persistent cart (guest via signed cookie; logged-in via DB)
- Cart drawer (slide-over) + full cart page
- **Live effective pricing** (cart reflects current sale prices; see Section 7)

**Checkout & payment (in v1)**

- Full checkout: contact + shipping details
- **Real online payment via a Turkish gateway (iyzico or PayTR)** — see `NOTE` below
- Shipping: **flat rate + free-over-threshold**, both configurable in admin
- Currency **TRY**, **KDV-included (tax-inclusive) pricing**
- **Guest checkout allowed**
- Order creation with immutable line-item snapshot

`NOTE (payment provider):` **RESOLVED 2026-07-03 (R7): iyzico.** The cart and checkout flow are still built provider-agnostic so a later switch stays a contained swap.

**Auth**

- Register, login, logout, sessions
- Email/password + at least one social provider
- Email verification **deferred to Phase 2** (users may log in immediately in v1)

**Admin panel**

- Product CRUD (create/read/update/delete, publish/unpublish)
- Tag management (hierarchical + flat tags; see Section 3 and Section 5)
- Variant management with per-variant price and stock
- Sales/discounts: per-product and per-tag, scheduled with start/end
- Inventory management (stock counts, low-stock visibility)
- Image upload with in-app optimization
- Order list + status view
- Configurable settings: flat shipping rate, free-shipping threshold, low-stock threshold, manual-payment fallback copy

**Platform**

- SSR pages for storefront (SEO)
- Docker-based deploy to a self-hosted VPS via Coolify
- Cloudflare in front for caching + DDoS protection
- **Nightly automated PostgreSQL backup pushed off-VPS to Cloudflare R2**
- Cloudflare Web Analytics + Sentry (free tier) for analytics and error tracking

### 2.2 Phase 2 (near-term roadmap)

- Transactional emails (order confirmation, shipping) via Resend + React Email
- Email verification at registration (enabled once email lands; R11 — credentials login blocked until verified, Google auto-verified, env-gated)
- Password reset via emailed link (R12 — added to scope 2026-07-05; also lets social-only accounts set a password)
- Automatic invoicing with server-side PDF generation (with KDV breakdown line)
- Full order management in admin (status transitions, fulfillment)
- Address book, saved addresses
- Product reviews/ratings
- Automatic Best-Sellers ranking (driven by real order data)

### 2.3 Phase 3+ (later)

- Discount/coupon codes
- Wishlist / favorites
- Multi-admin roles and permissions
- Analytics dashboard in admin
- Internationalization / multi-currency
- Inventory reservation on add-to-cart with timeout
- Dark theme

---

## 3. Navigation model — tag-based (replaces categories)

**There is no rigid "category" concept.** Navigation and collections are driven entirely by a single flexible **tag** system. This is simpler to build and more flexible for the owner than fixed categories.

### 3.1 How tags work

- A product can have **many tags** at once (e.g., a figure = `anime` + `best-seller`).
- **Hierarchical tags** have subtags — used for primary navigation. Example: `figures` (parent) → `anime`, `games` (children). A product tagged `anime` also appears under its parent `figures`.
- **Flat tags** have no subtags — used as standalone collections. Example: `best-seller`.
- Every tag has its own browseable page: `/t/[tagSlug]` (e.g., `/t/anime`, `/t/best-seller`).
- Storefront nav and homepage sections are simply "show products with tag X."

### 3.2 Special cases

- **Sales is NOT a tag.** It is an automatic view powered by the scheduled-sales system (Section 7). Any product on an active sale appears in the Sales view automatically — the owner never manually tags/untags for sales. Route: `/sales`.
- **Best Sellers is a manual flat tag in v1.** The owner tags products they want featured. In Phase 2 this becomes automatic (ranked by real order data). `LANDED 2026-07-09 (R20):` automatic ranking (units sold, trailing 90 days, PAID/FULFILLED) drives the homepage section and the `/best-sellers` derived view; the manual tag remains only as cold-start filler.
- **New Arrivals** is an automatic view sorted by `Product.createdAt` — not a tag.

### 3.3 Seed tags (starting set)

Hierarchical:

- `figures` → `anime`, `games`, `scale`, `garage-kits`
- `handcrafts` → `keychains`, `accessories`, `plush`
- `art-prints` → `posters`, `framed`, `postcards`
- `stickers` → `die-cut`, `sheets`

Flat:

- `best-seller`, `limited-edition`, `misc`

`ASSUMPTION:` Two levels of tag depth (parent → child) suffice for v1. The data model supports self-referential nesting so deeper trees are possible later without migration.

---

## 4. Information architecture / sitemap

### 4.1 Storefront routes (Next.js App Router)

```
/                         Homepage (Sales, New Arrivals, Best Sellers, Featured, tag entry)
/products                 All products (PLP) with filters + infinite scroll
/t/[tagSlug]              Tag page (PLP filtered to a tag; e.g., /t/anime)
/sales                    Auto-generated view of all actively-discounted products
/p/[productSlug]          Product detail (PDP)
/search?q=                Search results
/cart                     Full cart page (mirrors cart drawer)
/checkout                 Checkout (contact, shipping, payment)
/checkout/confirmation    Order placed confirmation
/account                  Account dashboard (requires auth)
/account/orders           Order history
/login  /register         Auth
/about  /contact          Static/brand pages
/legal/*                  Terms, privacy, returns/shipping policy
```

### 4.2 Admin routes

```
/admin                    Dashboard (KPIs, low-stock, active sales, recent orders)
/admin/products           Product list + search/filter
/admin/products/new       Create product
/admin/products/[id]      Edit product (variants, images, pricing, tags)
/admin/tags               Tag management (hierarchical + flat)
/admin/sales              Sales list + create/schedule
/admin/sales/[id]         Edit sale
/admin/inventory          Stock overview across variants
/admin/orders             Orders list + status view
/admin/settings           Shipping rate, free-shipping threshold, thresholds, payment copy
```

`ASSUMPTION:` Admin lives under `/admin` in the same Next.js app, gated by role. No separate deployment.

---

## 5. User stories with acceptance criteria

Format: role → story → acceptance criteria (AC). ACs are testable.

### 5.1 Storefront — homepage

**US-01 — Prominent hero sections**
As a shopper, I want the most important items (sales, new arrivals, best sellers) immediately visible.

AC:

- Above the fold on desktop, and after minimal scroll on mobile, the homepage shows a hero/featured block plus clearly labeled "On Sale," "New Arrivals," and "Best Sellers" sections.
- On-sale items render a sale badge and both original (strikethrough) and discounted price.
- Each section links to its full view (`/sales`, `/products?sort=newest`, `/best-sellers` since R20 — was `/t/best-seller` in v1).
- Sections are data-driven (sale schedule, `createdAt`, order-data ranking since R20 — was the `best-seller` tag in v1), not hardcoded.
- LCP ≤ 2.5s on mid-tier mobile over 4G.

**US-02 — Tag navigation from home**
As a shopper, I want to jump into a product tag/collection from the homepage.

AC:

- Visible navigation (nav bar + homepage tag grid) lists top-level hierarchical tags.
- Selecting a tag routes to `/t/[slug]` showing that tag's products (including products under its subtags).

### 5.2 Storefront — browsing, filtering, search

**US-03 — Product listing with filters, sort, infinite scroll**
As a shopper, I want to filter, sort, and scroll through products.

AC:

- PLP supports filters: tag, price range, on-sale, in-stock.
- PLP supports sort: newest, price ascending/descending, on-sale first.
- Filters and sort reflect in the URL (query params) so results are shareable and back/forward works.
- **Infinite scroll** loads more products as the user scrolls, without a full page reload.
- For SEO, a crawlable paginated fallback (or a complete `sitemap.xml` listing every product URL) ensures search engines can reach all products despite infinite scroll.
- Empty state renders a branded "no results" message with a reset action.

**US-04 — Search**
As a shopper, I want to search by keyword.

AC:

- A header search input routes to `/search?q=`.
- Matches product name and description (case-insensitive, partial match).
- Results reuse the PLP layout with the same filter/sort controls.
- `ASSUMPTION:` v1 search is Postgres `ILIKE`/full-text; no external search service.

### 5.3 Storefront — product detail and variants

**US-05 — Variant selection with per-variant price and stock**
As a shopper, I want to choose a product's version (painted vs. unpainted, size) and see exact price/availability.

AC:

- PDP shows all variant options grouped by option type (e.g., "Finish": Painted/Unpainted; "Size": S/M/L).
- Selecting a combination updates displayed price, stock status, and variant-specific image if defined.
- Out-of-stock combinations disable add-to-cart with a clear "Out of stock" label.
- On-sale variants show both original and sale price.
- Default selected variant = lowest-priced in-stock variant, else first defined variant.
- Add-to-cart disabled until a complete valid combination is selected (for products with variants).

**US-06 — Product media**
As a shopper, I want multiple clear images.

AC:

- PDP shows a gallery (multiple images) with a primary image and thumbnails.
- Images served in optimized/responsive sizes.
- Images have descriptive alt text.

### 5.4 Storefront — cart

**US-07 — Add to cart (variant-aware, live pricing)**
As a shopper, I want to add a specific variant.

AC:

- Adding a variant creates or increments a cart line for that exact variant.
- Cart drawer opens (or toast confirms) on add, showing line, quantity, subtotal.
- Cart persists across reloads for guests (signed cookie) and across devices for logged-in users (DB).
- **Cart prices reflect current effective (sale-aware) pricing at view time.** If a sale starts or ends while an item is in the cart, the cart shows the current price; the price the customer pays is the effective price at checkout, shown clearly before payment.

**US-08 — Update / remove cart items**
As a shopper, I want to change quantities or remove items.

AC:

- Quantity up/down with immediate subtotal recalculation.
- Quantity cannot exceed available stock; UI blocks and explains.
- Removing a line updates cart and subtotal.
- Empty cart shows a branded empty state with a browse CTA.

### 5.5 Storefront — checkout & payment (v1)

**US-09 — Checkout and pay**
As a shopper, I want to enter my details and pay online.

AC:

- Checkout collects name, email, shipping address, and optional notes.
- Shipping cost computed from admin settings: flat rate, waived when order subtotal ≥ free-shipping threshold.
- All displayed prices are TRY and KDV-inclusive.
- Guests check out with email; logged-in users have details pre-filled.
- Payment processed via the integrated Turkish gateway (iyzico or PayTR).
- On successful payment, an `Order` is created with status `PAID` and an immutable snapshot of line items, prices, shipping, and totals.
- On failed/abandoned payment, no `PAID` order is created; the cart is preserved.
- Confirmation page shows order number and summary.

`NOTE:` A manual/bank-transfer fallback (order created as `PENDING_PAYMENT` with admin-configured instructions) may be retained as a secondary option, controlled by an admin toggle, in case gateway onboarding is delayed. Primary path is real online payment.

### 5.6 Auth

**US-10 — Register / login / logout**
As a user, I want an account so my cart and orders persist.

AC:

- Register with email/password; password stored hashed (never plaintext).
- Login with email/password and at least one social provider.
- Logout ends the session.
- Protected routes (`/account/*`, `/admin/*`) redirect unauthenticated users to login; admin routes additionally require the `ADMIN` role, enforced server-side.
- On login, a guest cart merges into the user's DB cart (dedupe by variant, sum quantities capped at stock).
- Email verification is **not required in v1** (deferred to Phase 2).

### 5.7 Admin — products, variants, tags

**US-11 — Create/edit a product with variants and tags**
As the store owner, I want to create a product, add images, define variants, and apply tags.

AC:

- Create product with name, slug (auto from name, editable), description (rich text or markdown), status (draft/published), and any number of tags (hierarchical and/or flat).
- Add images via upload; optimized on upload (sharp), stored in R2; choose a primary image; reorder images.
- Define option types (e.g., Finish, Size) and values; system generates variant combinations, each with editable SKU, price, and stock.
- Products with no variants supported (single default variant with one price/stock).
- Save validates: name required, ≥1 image recommended (warn), price ≥ 0, stock ≥ 0.
- Unpublished products are not visible on the storefront.

**US-12 — Manage tags**
As the store owner, I want to create and organize tags.

AC:

- Create/edit/delete tags with name, slug, type (hierarchical or flat), optional parent (for hierarchical), optional image, and sort order.
- Deleting a tag removes it from products but never deletes the products themselves.
- Tag sort order controls storefront display order.
- A product can be assigned to many tags.

### 5.8 Admin — sales

**US-13 — Run and schedule a sale**
As the store owner, I want to discount products or a tag for a period.

AC:

- Create a sale with: name, discount type (percentage or fixed amount), value, scope (specific products or a whole tag), start/end datetime.
- While active, affected products/variants show sale pricing and badges on the storefront and appear in `/sales` automatically.
- Sales auto-activate and auto-expire on schedule (server-evaluated; no manual toggle needed).
- **Overlap rule: best price for the customer wins** (Section 7).
- Admin can end a sale early.

### 5.9 Admin — inventory

**US-14 — Manage inventory**
As the store owner, I want to see and adjust stock across variants.

AC:

- Inventory view lists variants with current stock, product, and low-stock highlight below the configurable threshold.
- Stock editable inline.
- Out-of-stock variants are non-purchasable on the storefront.
- `NOTE (decrement timing — deferred detail):` Stock decrements on successful payment (`PAID`) in v1. Reservation-on-add-to-cart with timeout is Phase 3.

### 5.10 Admin — dashboard & settings

**US-15 — Admin dashboard**
AC:

- Dashboard shows counts: products, active sales, low-stock items, recent orders, with links to each management screen.
- `ASSUMPTION:` Revenue analytics are Phase 2+.

**US-16 — Store settings**
AC:

- Admin can set and change: flat shipping rate, free-shipping threshold, low-stock threshold, and (if used) manual-payment instruction copy — without a developer.

---

## 6. Data model outline (Prisma / PostgreSQL)

Schema outline for the implementer, not final Prisma syntax. **Money is stored as integers in minor units** (`priceCents` = kuruş). Timestamps use `createdAt`/`updatedAt`.

### 6.1 Entities

**User**

- `id`, `email` (unique), `passwordHash` (nullable for social-only), `name`, `role` (`CUSTOMER` | `ADMIN`), `emailVerifiedAt?`
- Relations: `accounts` (Auth.js), `sessions`, `orders`, `cart`

**Account / Session / VerificationToken** — standard Auth.js Prisma adapter tables.

**Tag**

- `id`, `name`, `slug` (unique), `type` (`HIERARCHICAL` | `FLAT`), `parentId?` (self-relation, hierarchical only), `imageKey?`, `sortOrder`
- Relation: `products` via `ProductTag` join (many-to-many)

**ProductTag** (join)

- `productId`, `tagId` (composite unique). Enables a product in many tags.

**Product**

- `id`, `name`, `slug` (unique), `description`, `status` (`DRAFT` | `PUBLISHED`), `isFeatured` (bool), `publishedAt?`, `createdAt` (powers New Arrivals)
- Relations: `images` (ProductImage[]), `optionTypes` (OptionType[]), `variants` (Variant[]), `tags` (via ProductTag)

**ProductImage**

- `id`, `productId`, `key` (R2 object key), `alt`, `sortOrder`, `isPrimary`, `variantId?`

**OptionType** (e.g., "Finish", "Size")

- `id`, `productId`, `name`, `sortOrder`

**OptionValue** (e.g., "Painted", "Unpainted")

- `id`, `optionTypeId`, `value`, `sortOrder`

**Variant**

- `id`, `productId`, `sku?` (unique), `priceCents`, `stock` (int), `isActive` (bool)
- Relation: `optionValues` via `VariantOptionValue`
- A product with no options has exactly one variant.

**VariantOptionValue** (join)

- `variantId`, `optionValueId` (one value per option type per variant)

**Sale**

- `id`, `name`, `type` (`PERCENT` | `FIXED`), `value` (int; percent 0–100 or fixed minor units), `startsAt`, `endsAt`, `endedEarly` (bool)
- Scope via join tables:
  - **SaleProduct** (`saleId`, `productId`)
  - **SaleTag** (`saleId`, `tagId`)
- Effective price resolved in the application layer at read time (Section 7).

**Cart**

- `id`, `userId?` (null for guest), `sessionToken?` (guest id), timestamps
- Relation: `items` (CartItem[])

**CartItem**

- `id`, `cartId`, `variantId`, `quantity`; unique (`cartId`, `variantId`).

**Order**

- `id`, `orderNumber` (human-readable, unique), `userId?`, `email`, `status` (`PENDING_PAYMENT` | `PAID` | `CANCELLED` | `FULFILLED`), `subtotalCents`, `discountCents`, `shippingCents`, `totalCents`, `shippingAddress` (JSON or `Address` relation), `notes?`, `paymentProvider?`, `paymentRef?`, `placedAt`, `carrier?`, `trackingNumber?`, `shippedAt?` (R13, Phase 2)
- Relation: `items` (OrderItem[])

**OrderItem** (immutable snapshot)

- `id`, `orderId`, `variantId?` (nullable if product later deleted), `productNameSnapshot`, `variantLabelSnapshot`, `unitPriceCents`, `quantity`, `lineTotalCents`
- Snapshots ensure order history never changes when the catalog changes.

**Setting** (single-row or key-value)

- `flatShippingCents`, `freeShippingThresholdCents`, `lowStockThreshold`, `manualPaymentEnabled` (bool), `manualPaymentInstructions?`

### 6.2 Indexing / integrity notes

- Index `Product.slug`, `Tag.slug`, `Product.status`, `Product.createdAt`, `Variant.productId`, `ProductTag(productId, tagId)`, `CartItem(cartId, variantId)`.
- Foreign keys with sensible `onDelete`: deleting a product cascades images/variants/tags-joins; blocked if orders reference it (hence nullable `variantId` on OrderItem + snapshots).
- All prices integer minor units. Single currency v1: **TRY**.

---

## 7. Pricing and sale resolution (business logic)

Effective price is **computed at read time, never stored** as a "sale price" field on the variant — this keeps sales schedulable and reversible.

Resolution algorithm (per variant):

1. Start with `variant.priceCents`.
2. Gather active sales — `now` within `startsAt`/`endsAt` and not `endedEarly` — that apply via `SaleProduct` (product match) or `SaleTag` (any of the product's tags match).
3. Compute the discounted price for each applicable sale.
4. **Overlap rule: best price for the customer wins** — apply the single discount that yields the lowest price. No stacking.
5. Expose `{ originalCents, effectiveCents, onSale: boolean, saleId? }` to the UI.

Cart uses **live effective price** until checkout. Order totals capture the effective price as an immutable snapshot at order creation.

All prices are **KDV-inclusive** (tax already in the displayed price). A KDV breakdown line is added at the invoicing stage in Phase 2.

---

## 8. Design and UX requirements (for the designer)

The storefront must feel like an art piece. This section is prescriptive on tokens and directional on execution.

### 8.1 Brand color palette (design tokens)

```css
--ink: #000000; /* body + heading text */
--bg: #f2f2f2; /* page background ("white") */
--surface: #ffffff; /* cards / elevated surfaces */
--primary: #b6bff2; /* primary buttons / interactive */
--primary-2: #a7b3d9; /* secondary / hover / darker button state */
--accent: #d9c99a; /* gold — highlights, sale badges, emphasis */
/* Supporting pastels from the original scheme, for surfaces/borders: */
--lavender-grey: #989dbf;
--ghost-white: #f4f3f9;
--lavender-grey-2: #a8adc9;
--pale-slate: #b8bcd0;
```

Semantic tokens the designer should define on top: `--bg`, `--surface`, `--text` (=`--ink`), `--text-muted`, `--border`, `--primary`, `--primary-contrast`, `--accent`, `--sale`, `--focus-ring`.

Contrast guidance:

- Body/heading text is **black** on light pastel backgrounds — meets WCAG AA comfortably.
- **Black text on `--primary` (`#B6BFF2`) buttons is borderline.** The designer should verify contrast and, if needed, either darken the button toward `--primary-2` or use white button text for primary CTAs. `--accent` gold is for highlighting/badges, not primary button fills.
- Provide a light theme for v1; leave hooks for dark theme (Phase 3).

### 8.2 Typography

- Pairing: a distinctive **display serif or high-contrast sans** for headings/hero (art-gallery feel), paired with a clean, legible **sans** for body/UI.
- Modular type scale (~1.25 ratio): caption → body → h4 → h3 → h2 → h1/display.
- Body line-height 1.5–1.6; tighter for large display.
- Self-host fonts via `next/font` — no runtime font CDN (supports cost/perf/privacy goals).

### 8.3 Spacing and layout

- 8px base unit; scale 4, 8, 12, 16, 24, 32, 48, 64.
- Generous whitespace — let the art breathe.
- Max content width for reading; edge-to-edge / wide grids for imagery.
- Image-led product cards with restrained metadata (name, price, sale badge).

### 8.4 Imagery treatment

- Product photography is the hero. Consistent aspect ratios per context (1:1 or 4:5 cards; larger 3:2/4:5 on PDP).
- Subtle framing — soft shadows or thin `--border`; avoid heavy chrome.
- Always responsive `srcset`/sizes; lazy-load below the fold; explicit width/height to prevent layout shift.

### 8.5 Motion and micro-interactions

- Purposeful, restrained motion — calm and confident, not bouncy.
- Micro-interactions: subtle product-card hover (image zoom or secondary-image swap), smooth cart-drawer slide, gentle section reveal.
- Durations 150–300ms, ease-out; respect `prefers-reduced-motion`.
- Animate transform/opacity only; no layout-shifting animation.

### 8.6 Key screens to deliver

Homepage, PLP (with filter UI + infinite scroll), PDP (variant states: default, out-of-stock, on-sale), cart drawer + cart page, checkout (incl. payment step), auth, empty/loading/error states, and admin core screens (product edit, variant matrix, tag manager, sale scheduler, inventory table, settings). Mobile + desktop for storefront; desktop-first acceptable for admin.

### 8.7 Component library

Radix UI primitives / shadcn (headless, accessible) styled custom against the tokens: cart drawer (Dialog/Sheet), modals, dropdowns/selects (variant pickers), toasts, tabs, tooltip. Custom styling must preserve Radix accessibility (focus management, ARIA).

---

## 9. Non-functional requirements (NFRs)

### 9.1 Performance

- LCP ≤ 2.5s, CLS < 0.1, INP < 200ms on mid-tier mobile / 4G.
- SSR / static optimization where possible; product data cached with tag-based revalidation.
- Lighthouse performance ≥ 90 on homepage and PDP.
- Images optimized on upload (sharp) into multiple sizes; served via `next/image` behind Cloudflare cache.

### 9.2 Responsiveness / mobile

- Mobile-first; fully functional from 360px width up.
- Touch targets ≥ 44px; cart, filters, and variant selection usable one-handed.

### 9.3 Accessibility

- WCAG 2.1 AA: contrast, keyboard nav, focus visibility, semantic landmarks, alt text, form labels, ARIA via Radix.
- `prefers-reduced-motion` respected.

### 9.4 Security

- Passwords hashed (Auth.js / bcrypt or argon2). Never plaintext.
- All admin/account routes authorization-checked server-side (not just hidden in UI).
- CSRF protection on mutations; session cookies `httpOnly`, `secure`, `sameSite`.
- Input validation/sanitization (zod) on all server actions / API routes.
- Rate limiting on auth endpoints (app-level or Cloudflare).
- Secrets in env (managed via Coolify), never committed.
- Cloudflare in front for DDoS/WAF (free tier).
- Payment handled via the gateway's hosted/tokenized flow — **no raw card data touches the server or database.**
- HTTPS enforced (Coolify + Cloudflare).

### 9.5 Reliability / operations

- **Nightly automated PostgreSQL backup (`pg_dump`) pushed off-VPS to Cloudflare R2.** Verify restore procedure.
- Health-check endpoint for the container.
- Structured logging; **Sentry (free tier)** for error tracking.

### 9.6 SEO

- SSR HTML for crawlable content; per-page `<title>`/meta/OpenGraph; product structured data (schema.org `Product`/`Offer`); `sitemap.xml` (listing all products, to offset infinite scroll); `robots.txt`; canonical URLs.

---

## 10. Technical architecture overview

### 10.1 Stack

| Layer                     | Choice                                                               | Notes / cost                                            |
| ------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------- |
| Framework                 | Next.js (App Router), SSR                                            | Storefront + admin + API/server actions in one codebase |
| Language                  | TypeScript throughout                                                | —                                                       |
| DB                        | PostgreSQL, self-hosted via Docker                                   | Free (VPS cost only)                                    |
| ORM                       | Prisma (schema = source of truth, migrations)                        | Free                                                    |
| Auth                      | Auth.js (NextAuth) — email/password + social; sessions               | Free; Prisma adapter                                    |
| Styling                   | Tailwind CSS + palette tokens; Radix/shadcn components               | Free                                                    |
| Images                    | Cloudflare R2 (zero egress) storage; sharp on-upload optimize/resize | R2 free tier: 10GB + generous ops                       |
| Deploy                    | Docker, self-hosted VPS; Coolify (git-push deploys, HTTPS, env)      | Coolify free/OSS; VPS is main recurring cost            |
| CDN/Security              | Cloudflare free tier (cache, bandwidth, DDoS, WAF)                   | Free                                                    |
| Analytics                 | Cloudflare Web Analytics                                             | Free                                                    |
| Error tracking            | Sentry                                                               | Free tier                                               |
| Payments                  | iyzico or PayTR (decide before checkout build)                       | Transaction fees when live                              |
| Email/invoicing (Phase 2) | Resend + React Email; server-side PDF                                | Resend free tier, then usage-based                      |

### 10.2 Runtime topology (v1)

```
Client ──HTTPS──> Cloudflare (CDN cache, WAF, DDoS)
                      │
                      ▼
                  VPS (Docker via Coolify)
                   ├── Next.js app container (SSR + admin + API/server actions)
                   └── PostgreSQL container (volume-backed)
                      │
                      ├──> Cloudflare R2 (product images; public read via CDN)
                      └──> Cloudflare R2 (nightly DB backups, off-box)
                      │
                      ▼
                  Payment gateway (iyzico / PayTR) via hosted/tokenized flow
```

- Next.js runs as a Node server (not static export) to support SSR, server actions, and Auth.js.
- R2 objects served via public bucket behind Cloudflare.
- Prisma migrations run on deploy.

### 10.3 Cost commentary (cheapest viable but real)

- **Genuinely cheap and scalable:** Coolify, Postgres-in-Docker, Cloudflare free CDN/WAF, R2 zero-egress, self-hosted fonts, Cloudflare Analytics, Sentry free tier.
- **Where the cheap path bites:** Postgres in a container on the same single VPS means **database availability equals app availability**, and backups are your responsibility (mitigated here by the nightly off-box R2 backup). Revisit with managed Postgres as revenue grows.
- **Where costs begin:** the VPS (fixed monthly), R2 beyond free tier, Resend beyond free tier (Phase 2), payment transaction fees, and any paid error-tracking tier later.
- **Single point of failure:** one VPS, one region — acceptable for v1. Coolify eases migration to a bigger/second VPS later.

### 10.4 Key implementation notes (for the AI implementer)

- Use Next.js server actions or route handlers for mutations; validate everything with zod.
- Cache product/tag reads with tag-based revalidation; bust cache on admin writes.
- Cart: guest cart keyed by a signed cookie; merge into DB cart on login.
- Money as integers everywhere; format only at the view layer.
- Image upload pipeline: receive → validate (type/size) → sharp resize to defined sizes → upload derivatives to R2 → store keys.
- Payment: use the gateway's hosted/tokenized flow; create the `PAID` order only on a verified success callback/webhook; never trust client-side success alone.
- Build the checkout payment step behind a small interface so iyzico vs. PayTR is a swappable implementation.

---

## 11. Success metrics

| Metric                                         | Target (v1 baseline to refine)                            |
| ---------------------------------------------- | --------------------------------------------------------- |
| Conversion rate (visit → paid order)           | Establish baseline; improve over time                     |
| Cart abandonment rate                          | Track and benchmark                                       |
| LCP (mobile)                                   | ≤ 2.5s                                                    |
| Lighthouse performance (home, PDP)             | ≥ 90                                                      |
| Admin task completion without engineering help | Owner can add a product + apply tags + run a sale unaided |
| Monthly infra cost                             | Within VPS + free tiers (define ceiling)                  |
| Organic sessions                               | Month-over-month growth (post-SEO)                        |
| Error rate                                     | < 1% of requests                                          |

---

## 12. Dependencies

- **VPS availability** — v1 deployment depends on securing a VPS (a friend's may be available). Until then, dev runs locally via Docker Compose.
- Cloudflare account (free) for DNS, CDN, WAF, R2, Analytics.
- Domain name registration (`mofutenshi.com` — R8, not yet purchased).
- Social login provider credentials (e.g., Google) for OAuth.
- Coolify installed on the VPS.
- **Payment gateway merchant account** (iyzico or PayTR) — required before the payment step goes live.
- Content: product photography and copy from the owner (blocks a meaningful storefront regardless of code readiness).

---

## 13. Assumptions

1. Single admin user; no role hierarchy in v1.
2. Single currency: **TRY**; pricing is **KDV-inclusive**.
3. Two-level tag depth suffices for v1; schema allows deeper later.
4. Products can belong to **many tags** (many-to-many).
5. v1 search is Postgres-based (ILIKE/full-text); no external search service.
6. Self-hosted fonts via `next/font`; no runtime font CDN.
7. Email verification deferred to Phase 2; immediate login allowed in v1.
8. Admin lives under `/admin` in the same app, route-gated.
9. Postgres runs in Docker on the same VPS as the app in v1, with nightly off-box backups to R2.
10. Stock decrements on successful payment (`PAID`) in v1.
11. Best Sellers is a manual tag in v1; automatic ranking is Phase 2.

---

## 14. Out of scope for v1 (explicit)

- Transactional emails and automatic invoicing / PDF generation (Phase 2).
- Email verification at registration (Phase 2).
- Full order management/fulfillment workflow in admin — v1 is order list + status view (Phase 2 for transitions/fulfillment).
- Coupon/discount codes.
- Wishlist / favorites.
- Product reviews and ratings.
- Multi-admin roles and permissions.
- Internationalization and multi-currency.
- Inventory reservation/holds with timeout.
- Automatic Best-Sellers ranking.
- Subscriptions, digital goods, gift cards.
- Native mobile app.
- Advanced search (external engine, typo tolerance, synonyms).
- Recommendations / "related products."
- Dark theme (hooks only; not delivered).
- Returns/refunds **workflow** — v1 provides a returns **policy page** only; actual returns handled manually.

---

## 15. Remaining decision

**RESOLVED 2026-07-03 (DECISIONS.md R7): payment provider = iyzico** — chosen for easier integration and documentation over PayTR's lower fees. The checkout is built provider-agnostic so a provider switch remains a swap-in.

---

## Appendix A — Variant model worked example

A figure "Angel Statue" with two option types:

- "Finish": Painted, Unpainted
- "Size": 20cm, 40cm

Generates up to 4 variants, each with its own price/stock:

| Variant          | priceCents | stock            |
| ---------------- | ---------- | ---------------- |
| Painted / 20cm   | 4500       | 3                |
| Painted / 40cm   | 8900       | 1                |
| Unpainted / 20cm | 2900       | 5                |
| Unpainted / 40cm | 5900       | 0 (out of stock) |

PDP behavior: selecting Unpainted + 40cm shows ₺59.00, out of stock, add-to-cart disabled. A sale scoped to the `figures` tag ("Figures −15%") active now renders each as strikethrough original + discounted effective price, and all four appear in `/sales` automatically.

## Appendix B — Tag model worked example

A product "Miku Nendoroid" is tagged: `anime` (child of `figures`), `best-seller` (flat).

- Appears on `/t/anime`.
- Appears on `/t/figures` (parent of `anime`).
- Appears on `/t/best-seller`.
- If put on an active sale, also appears on `/sales` automatically (not via a tag).
- Appears in homepage "Best Sellers" (driven by order-data ranking since R20; the `best-seller` tag now only fills the section before real sales exist) and, if recently created, in "New Arrivals" (driven by `createdAt`).
