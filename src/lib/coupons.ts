import { auth } from "@/lib/auth";
import { couponCopy } from "@/lib/copy/coupons";
import { prisma } from "@/lib/prisma";

// R23 coupon engine: percent-only, applied to the sale-priced products
// subtotal, one coupon per order. Always validated against FRESH DB state —
// a code sitting in a cart may have expired or hit its cap by checkout time.

// Codes are ASCII-only by construction, so plain toUpperCase is safe (no
// Turkish dotted-i trap).
export function normalizeCouponCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export const COUPON_CODE_PATTERN = /^[A-Z0-9-]{3,32}$/;

// Mirrors pricing.ts percent rounding: the discounted amount is floored in
// the customer's favor, so the discount itself rounds up.
export function couponDiscountCents(subtotalCents: number, percentOff: number): number {
  return subtotalCents - Math.floor((subtotalCents * (100 - percentOff)) / 100);
}

// The once-per-customer identity for logged-in carts; guests are checked in
// placeOrder with the submitted checkout email.
export async function accountEmail(): Promise<string | null> {
  const session = await auth();
  return session?.user?.email ?? null;
}

export type CouponCheck =
  | { ok: true; couponId: string; code: string; percentOff: number; discountCents: number }
  | { ok: false; error: string };

// email is null when unknown (guest before the checkout form is submitted) —
// the once-per-customer rule is then re-checked in placeOrder with the real
// address. Redemptions on CANCELLED orders do not count (slot is freed).
export async function checkCoupon(
  rawCode: string,
  subtotalCents: number,
  email: string | null,
): Promise<CouponCheck> {
  const code = normalizeCouponCode(rawCode);
  if (!COUPON_CODE_PATTERN.test(code)) return { ok: false, error: couponCopy.notFound };

  const coupon = await prisma.coupon.findUnique({
    where: { code },
    select: {
      id: true,
      code: true,
      percentOff: true,
      startsAt: true,
      endsAt: true,
      minSubtotalCents: true,
      maxRedemptions: true,
      isActive: true,
    },
  });
  if (!coupon || !coupon.isActive) return { ok: false, error: couponCopy.notFound };

  const now = new Date();
  if (now < coupon.startsAt || now > coupon.endsAt) return { ok: false, error: couponCopy.expired };

  if (subtotalCents < coupon.minSubtotalCents)
    return { ok: false, error: couponCopy.belowMinimum(coupon.minSubtotalCents) };

  if (coupon.maxRedemptions !== null) {
    const used = await prisma.couponRedemption.count({
      where: { couponId: coupon.id, order: { status: { not: "CANCELLED" } } },
    });
    if (used >= coupon.maxRedemptions) return { ok: false, error: couponCopy.capReached };
  }

  if (email) {
    const priorUse = await prisma.couponRedemption.findFirst({
      where: {
        couponId: coupon.id,
        email: email.toLowerCase(),
        order: { status: { not: "CANCELLED" } },
      },
      select: { id: true },
    });
    if (priorUse) return { ok: false, error: couponCopy.alreadyUsed };
  }

  return {
    ok: true,
    couponId: coupon.id,
    code: coupon.code,
    percentOff: coupon.percentOff,
    discountCents: couponDiscountCents(subtotalCents, coupon.percentOff),
  };
}
