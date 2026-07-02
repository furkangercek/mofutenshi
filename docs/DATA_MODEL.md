# Data Model

Entity reference for the Prisma schema. Once `prisma/schema.prisma` exists, THAT file is the source of truth and this doc explains intent and invariants only.

## Invariants (do not violate)

1. All money fields are integer minor units (`priceCents`, `totalCents`, …). Single currency in v1.
2. Sale/discount prices are never stored on `Variant` — computed at read time from active `Sale` rows.
3. `OrderItem` snapshots product name, variant label, and unit price at order creation. Orders never change when the catalog changes.
4. Every product has ≥1 variant. A no-options product gets one default variant. All price/stock lives on variants, never on `Product`.
5. One cart line per (cart, variant): unique composite key, quantity increments.

## Entities

### Catalog

- **Product** — `id, name, slug (unique), description, status (DRAFT|PUBLISHED), categoryId, isFeatured, publishedAt?`
  - "New Arrivals" derives from `publishedAt`/`createdAt`; "Featured" from `isFeatured`.
- **Category** — `id, name, slug (unique), parentId? (self-relation), imageKey?, sortOrder`
  - Two-level depth used in v1; schema allows deeper. Product has ONE primary category (v1 assumption — DECISIONS Q15).
- **ProductImage** — `id, productId, key (R2), alt, sortOrder, isPrimary, variantId?`
- **OptionType** — `id, productId, name, sortOrder` (e.g., "Finish", "Size")
- **OptionValue** — `id, optionTypeId, value, sortOrder` (e.g., "Painted")
- **Variant** — `id, productId, sku? (unique), priceCents, stock, isActive`
- **VariantOptionValue** — join (`variantId, optionValueId`); a variant has exactly one value per option type of its product.

### Sales

- **Sale** — `id, name, type (PERCENT|FIXED), value, startsAt, endsAt, endedEarly`
- **SaleProduct** / **SaleCategory** — scope joins.
- Active = now within window AND not endedEarly. Overlap resolution: best price for customer wins (proposed, unconfirmed — DECISIONS Q3).

### Commerce

- **Cart** — `id, userId?, sessionToken?` (guest carts keyed by signed cookie; merged into user cart on login).
- **CartItem** — `id, cartId, variantId, quantity`; unique `(cartId, variantId)`; quantity capped at variant stock.
- **Order** — `id, orderNumber (human-readable, unique), userId?, email, status (PENDING_PAYMENT|PAID|CANCELLED|FULFILLED), subtotalCents, discountCents, shippingCents?, totalCents, shippingAddress (JSON), notes?, placedAt`
- **OrderItem** — `id, orderId, variantId? (nullable — survives catalog deletion), productNameSnapshot, variantLabelSnapshot, unitPriceCents, quantity, lineTotalCents`

### Auth

- **User** — `id, email (unique), passwordHash?, name, role (CUSTOMER|ADMIN), emailVerifiedAt?`
- **Account / Session / VerificationToken** — standard Auth.js Prisma adapter tables.

## Indexes

`Product.slug`, `Category.slug`, `Product(categoryId, status)`, `Product.createdAt`, `Variant.productId`, `CartItem(cartId, variantId)` unique, `Order.orderNumber` unique, `Sale(startsAt, endsAt)`.

## Deletion rules

- Delete product → cascade images, option types/values, variants. Blocked semantics for orders handled by nullable `OrderItem.variantId` + snapshots.
- Delete category with products → blocked; require reassignment first.
- Delete user → keep orders (nullable `userId`), anonymize email only if legally required (out of scope v1).
