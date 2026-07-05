# Data Model

Entity reference for the Prisma schema, aligned to PRD v2 §6. Once `prisma/schema.prisma` has models, THAT file is the source of truth and this doc explains intent and invariants only.

## Invariants (do not violate)

1. All money fields are integer minor units (`priceCents` = kuruş). Single currency: TRY, KDV-inclusive.
2. Sale/discount prices are never stored on `Variant` — computed at read time from active `Sale` rows (PRD §7). Overlap: best price for the customer wins, no stacking.
3. `OrderItem` snapshots product name, variant label, and unit price at order creation. Orders never change when the catalog changes.
4. Every product has ≥1 variant. A no-options product gets one default variant. All price/stock lives on variants, never on `Product`.
5. One cart line per (cart, variant): unique composite key, quantity increments, capped at stock.
6. Stock decrements ONLY on verified successful payment (`PAID`) — never on order creation, never on client-side success alone.
7. Navigation is tags, not categories: products ↔ tags are many-to-many; a product tagged with a child tag also appears on its parent tag's page.
8. Sales, New Arrivals, and (Phase 2) automatic Best Sellers are DERIVED views — never tags the owner maintains. Manual v1 exception: `best-seller` is a flat tag.

## Entities

### Tags & catalog

- **Tag** — `id, name, slug (unique), type (HIERARCHICAL|FLAT), parentId? (self-relation, hierarchical only), imageKey?, sortOrder`
  - Two-level depth used in v1; self-relation allows deeper later.
  - Seed: `figures→(anime, games, scale, garage-kits)`, `handcrafts→(keychains, accessories, plush)`, `art-prints→(posters, framed, postcards)`, `stickers→(die-cut, sheets)`; flat: `best-seller`, `limited-edition`, `misc`.
- **ProductTag** — join (`productId, tagId`, composite unique). A product can have many tags.
- **Product** — `id, name, slug (unique), description, status (DRAFT|PUBLISHED), isFeatured, publishedAt?, createdAt`
  - "New Arrivals" derives from `createdAt`; homepage sections are data-driven.
- **ProductImage** — `id, productId, key (R2), alt, sortOrder, isPrimary, variantId?`
- **OptionType** — `id, productId, name, sortOrder` (e.g., "Finish", "Size")
- **OptionValue** — `id, optionTypeId, value, sortOrder` (e.g., "Painted")
- **Variant** — `id, productId, sku? (unique), priceCents, stock, isActive`
- **VariantOptionValue** — join (`variantId, optionValueId`); one value per option type per variant.

### Sales

- **Sale** — `id, name, type (PERCENT|FIXED), value, startsAt, endsAt, endedEarly`
- **SaleProduct** / **SaleTag** — scope joins (specific products, or every product carrying a tag).
- Active = now within window AND not endedEarly. `/sales` view = any product with an applicable active sale.

### Commerce

- **Cart** — `id, userId?, sessionToken?` (guest carts keyed by signed cookie; merged into user cart on login, quantities summed capped at stock).
- **CartItem** — `id, cartId, variantId, quantity`; unique `(cartId, variantId)`.
- **Order** — `id, orderNumber (human-readable, unique), userId?, email, status (PENDING_PAYMENT|PAID|CANCELLED|FULFILLED), subtotalCents, discountCents, shippingCents, totalCents, shippingAddress (JSON), notes?, paymentProvider?, paymentRef?, placedAt, carrier?, trackingNumber?, shippedAt?`
  - `PAID` orders are created only on a verified gateway success callback/webhook.
  - `PENDING_PAYMENT` exists for the optional manual-payment fallback (admin toggle).
  - Tracking fields (R13) are set when the admin marks the order FULFILLED; all optional.
  - Cancelling a PAID order restocks its items (R14); the refund itself is manual.
- **OrderItem** — `id, orderId, variantId? (nullable — survives catalog deletion), productNameSnapshot, variantLabelSnapshot, unitPriceCents, quantity, lineTotalCents`

### Settings

- **Setting** — single-row or key-value: `flatShippingCents, freeShippingThresholdCents, lowStockThreshold, manualPaymentEnabled, manualPaymentInstructions?`

### Auth

- **User** — `id, email (unique), passwordHash?, name, role (CUSTOMER|ADMIN), emailVerified?` (named to match the stock Auth.js Prisma adapter)
- **Account / Session / VerificationToken** — standard Auth.js Prisma adapter tables.

## Indexes

`Product.slug`, `Tag.slug`, `Product(status, createdAt)`, `Variant.productId`, `ProductTag(productId, tagId)` unique, `CartItem(cartId, variantId)` unique, `Order.orderNumber` unique, `Sale(startsAt, endsAt)`.

## Deletion rules

- Delete tag → detach from products (delete join rows); never deletes products.
- Delete product → cascade images, option types/values, variants, tag joins. Order history survives via nullable `OrderItem.variantId` + snapshots.
- Delete user → keep orders (nullable `userId`).
