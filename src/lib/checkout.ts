import { getCartIdentity } from "@/lib/cart-identity";
import { accountEmail, checkCoupon } from "@/lib/coupons";
import { resolveEffectivePrice } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { loadActiveSales } from "@/lib/queries/catalog";
import { activeReservationTotals } from "@/lib/stock";
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

export type CheckoutCoupon = {
  couponId: string;
  code: string;
  percentOff: number;
  discountCents: number;
};

export type CheckoutCart = {
  lines: CheckoutLine[];
  subtotalCents: number;
  discountCents: number;
  coupon: CheckoutCoupon | null;
  // Set when a code is on the cart but no longer valid (expired, cap hit,
  // subtotal dropped below the minimum, ...) — the UI surfaces the message
  // and placeOrder refuses until the code is removed.
  couponError: string | null;
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
      couponCode: true,
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
              trackStock: true,
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

  // A quantity above current availability (stock minus other pending orders'
  // reservations, R26) would silently change the amount charged — reject and
  // let the customer re-check their cart. Made-to-order variants have no
  // stock semantics; reserveStock re-checks tracked lines under row locks.
  const tracked = visible.filter((item) => item.variant.trackStock);
  const reserved = await activeReservationTotals(tracked.map((item) => item.variant.id));
  if (
    tracked.some(
      (item) => item.quantity > item.variant.stock - (reserved.get(item.variant.id) ?? 0),
    )
  ) {
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
  // Free-shipping threshold reads the PRE-coupon subtotal (customer-favorable
  // and stable while codes are applied/removed).
  const shippingCents =
    subtotalCents >= settings.freeShippingThresholdCents ? 0 : settings.flatShippingCents;

  // R23: coupon applies on top of sale pricing. Once-per-customer is checked
  // with the account email here; guests are checked in placeOrder where the
  // checkout email is known.
  let coupon: CheckoutCoupon | null = null;
  let couponError: string | null = null;
  if (cart.couponCode) {
    const check = await checkCoupon(cart.couponCode, subtotalCents, await accountEmail());
    if (check.ok) {
      coupon = {
        couponId: check.couponId,
        code: check.code,
        percentOff: check.percentOff,
        discountCents: check.discountCents,
      };
    } else {
      couponError = check.error;
    }
  }

  return {
    ok: true,
    cart: {
      lines,
      subtotalCents,
      discountCents,
      coupon,
      couponError,
      shippingCents,
      totalCents: subtotalCents - (coupon?.discountCents ?? 0) + shippingCents,
      settings,
    },
  };
}
