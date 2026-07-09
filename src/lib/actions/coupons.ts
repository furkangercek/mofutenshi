"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getCartIdentity } from "@/lib/cart-identity";
import { loadCheckoutCart } from "@/lib/checkout";
import { couponCopy } from "@/lib/copy/coupons";
import { accountEmail, checkCoupon, normalizeCouponCode } from "@/lib/coupons";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request-context";

export type CouponFormState = { error: string | null };

const codeSchema = z.string().trim().min(1, couponCopy.notFound).max(64, couponCopy.notFound);

export async function applyCouponAction(
  _prev: CouponFormState,
  formData: FormData,
): Promise<CouponFormState> {
  const parsed = codeSchema.safeParse(formData.get("code"));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? couponCopy.notFound };

  // Codes are guessable strings — throttle brute-force probing.
  if (!consumeRateLimit(`coupon:${await clientIp()}`, 20, 10 * 60 * 1000))
    return { error: couponCopy.tooManyAttempts };

  const identity = await getCartIdentity();
  if (!identity) return { error: couponCopy.cartMissing };

  const cartResult = await loadCheckoutCart();
  if (!cartResult.ok) return { error: couponCopy.cartMissing };

  const check = await checkCoupon(parsed.data, cartResult.cart.subtotalCents, await accountEmail());
  if (!check.ok) return { error: check.error };

  await prisma.cart.updateMany({
    where: identity,
    data: { couponCode: normalizeCouponCode(parsed.data) },
  });
  refresh();
  return { error: null };
}

export async function removeCouponAction(): Promise<void> {
  const identity = await getCartIdentity();
  if (!identity) return;
  await prisma.cart.updateMany({ where: identity, data: { couponCode: null } });
  refresh();
}
