# Admin panel guide (owner-facing)

You only see customer-facing pages because the admin panel is deliberately
invisible: `/admin` returns a 404 to anyone who is not logged in as an
ADMIN user (this is a security feature — outsiders cannot even discover
that an admin panel exists). There is no link to it in the storefront; you
type the URL directly.

## Getting in (local machine, 2 minutes)

1. Start the stack:
   - Start **Docker Desktop** (it does not auto-start on this machine).
   - `npm run db:up` (database)
   - `npm run dev` (app at `http://localhost:3000`)
2. Go to `http://localhost:3000/login` and sign in with the local test
   admin (created during step-8 testing, exists only in your local DB):
   - Email: `admin@test.local`
   - Password: `test-password-1`
3. Now open `http://localhost:3000/admin` — the panel appears.

There is also a test customer (`customer@test.local`, same password) for
trying the shopper side of flows you set up in admin.

## Making YOUR OWN account an admin

Accounts are customers by default; promotion happens via script, never
through the UI:

1. Register normally at `http://localhost:3000/register`.
2. Run: `npm run admin:promote -- your@email.com`
3. **Log out and log back in** — the admin role is embedded in the login
   session, so it only takes effect on a fresh login.

The same procedure applies in production later (see `docs/DEPLOY.md`,
"First admin").

## What's inside

| Screen             | What you do there                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------- |
| `/admin`           | Dashboard: KPIs, low-stock warnings, active sales, recent orders                                        |
| `/admin/products`  | Create/edit products: options (e.g. Boyut), variants with price/stock/SKU, images, tags, publish status |
| `/admin/tags`      | The navigation tree: hierarchical tags (max 2 levels) + flat tags                                       |
| `/admin/sales`     | Schedule discounts (percent or fixed) on products or whole tags; end early                              |
| `/admin/inventory` | All variants in one table, inline stock editing                                                         |
| `/admin/orders`    | Order list + detail; confirm manual payments (this is what decrements stock) or cancel pending orders   |
| `/admin/settings`  | Shipping fee, free-shipping threshold, low-stock threshold, manual payment toggle + instructions text   |

Times/dates in the sales scheduler are Istanbul time. Money fields accept
Turkish format ("79,50").

## Testing image uploads

Uploads are disabled until the app has Cloudflare R2 credentials — the
product editor's **Görseller** section shows a configuration note instead
of an upload box. To enable locally:

1. Create the R2 bucket + API token (steps: `docs/LAUNCH_GUIDE.md` §3 —
   you can do this today, it's free and independent of the VPS/domain;
   without a domain, use the bucket's `r2.dev` public URL instead of
   `img.mofutenshi.com`).
2. Put all five `R2_*` values in your local `.env` (names in
   `.env.example`).
3. Restart `npm run dev`, open a product → Görseller:
   - JPEG/PNG/WebP/AVIF up to 10MB; alt text (image description) is
     required — it's an accessibility/SEO requirement, not nagging.
   - Images are auto-optimized (resized, converted to WebP) before upload.
   - The first image becomes the product's main photo.
4. Verify: the photo should appear on the product page and product cards
   in the storefront. Until R2 is configured, every product shows the
   gradient placeholder — that is expected, nothing is broken.

## Testing the full shop flow locally (no credentials needed)

1. In admin: create a product with a variant, stock ≥ 1, status PUBLISHED.
2. In settings: enable **manual payment** (bank-transfer style) if it is
   not already on.
3. In a private/incognito window (or logged in as the test customer): add
   the product to cart → checkout → choose manual payment → place order.
4. Back in admin → orders: the order is PENDING_PAYMENT. Confirm payment —
   stock decreases exactly then, never before.

Card payments additionally need iyzico sandbox keys in `.env`
(`docs/LAUNCH_GUIDE.md` §4) — after that the checkout shows the card
option and iyzico's test card numbers work end-to-end.

## Notes

- The local DB still contains step-8 test data (the two test users, orders
  `MT-TEST-1`/`MT-TEST-2`, placeholder settings values). `npm run db:seed`
  resets seed products/sales any time; it does not delete your test users.
- The admin panel is desktop-first by design for v1; use it on a laptop.
