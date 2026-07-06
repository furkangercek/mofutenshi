import { getCartIdentity } from "@/lib/cart-identity";
import { resolveEffectivePrice } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { loadActiveSales } from "@/lib/queries/catalog";
import { variantLabel } from "@/lib/variant-label";

// Checkout is the money boundary: everything here reads FRESH DB state
// (no "use cache") — the cached catalog views bound staleness for browsing,
// but an order must snapshot the price that is true right now.

export type CheckoutLine = {
  variantId: string;
  productName: string;
  variantLabel: string | null;
  quantity: number;
  unitCents: number;
  unitOriginalCents: number;
  lineCents: number;
};

export type CheckoutSettings = {
  flatShippingCents: number;
  freeShippingThresholdCents: number;
  manualPaymentEnabled: boolean;
  kdvRatePercent: number;
};

export type CheckoutCart = {
  lines: CheckoutLine[];
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  settings: CheckoutSettings;
};

export type CheckoutCartResult =
  { ok: true; cart: CheckoutCart } | { ok: false; reason: "empty" | "changed" };

export async function loadCheckoutCart(): Promise<CheckoutCartResult> {
  const identity = await getCartIdentity();
  if (!identity) return { ok: false, reason: "empty" };

  const cart = await prisma.cart.findUnique({
    where: identity,
    select: {
      id: true,
      items: {
        orderBy: { createdAt: "asc" },
        select: {
          quantity: true,
          variant: {
            select: {
              id: true,
              priceCents: true,
              stock: true,
              isActive: true,
              optionValues: {
                select: {
                  optionValue: {
                    select: { value: true, optionType: { select: { sortOrder: true } } },
                  },
                },
              },
              product: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                  tags: { select: { tagId: true } },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!cart) return { ok: false, reason: "empty" };

  // Same visibility rule as the cart view: deactivated/unpublished lines are
  // not part of what the customer sees, so they are not part of the order.
  const visible = cart.items.filter(
    (item) => item.variant.isActive && item.variant.product.status === "PUBLISHED",
  );
  if (visible.length === 0) return { ok: false, reason: "empty" };

  // A quantity above current stock would silently change the amount charged —
  // reject instead and let the customer re-check their cart.
  if (visible.some((item) => item.quantity > item.variant.stock)) {
    return { ok: false, reason: "changed" };
  }

  const settings = await prisma.setting.findUnique({
    where: { id: 1 },
    select: {
      flatShippingCents: true,
      freeShippingThresholdCents: true,
      manualPaymentEnabled: true,
      kdvRatePercent: true,
    },
  });
  if (!settings) throw new Error("Settings row missing — checkout cannot price shipping");

  const activeSales = await loadActiveSales(new Date());
  const lines = visible.map((item) => {
    const { variant } = item;
    const price = resolveEffectivePrice(
      variant.priceCents,
      { id: variant.product.id, tagIds: variant.product.tags.map((t) => t.tagId) },
      activeSales,
    );
    return {
      variantId: variant.id,
      productName: variant.product.name,
      variantLabel: variantLabel(variant.optionValues),
      quantity: item.quantity,
      unitCents: price.effectiveCents,
      unitOriginalCents: price.originalCents,
      lineCents: price.effectiveCents * item.quantity,
    };
  });

  const subtotalCents = lines.reduce((sum, line) => sum + line.lineCents, 0);
  const discountCents = lines.reduce(
    (sum, line) => sum + (line.unitOriginalCents - line.unitCents) * line.quantity,
    0,
  );
  const shippingCents =
    subtotalCents >= settings.freeShippingThresholdCents ? 0 : settings.flatShippingCents;

  return {
    ok: true,
    cart: {
      lines,
      subtotalCents,
      discountCents,
      shippingCents,
      totalCents: subtotalCents + shippingCents,
      settings,
    },
  };
}
