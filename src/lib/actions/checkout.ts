"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { saveAddressFromCheckout } from "@/lib/address-book";
import { auth } from "@/lib/auth";
import { clearCartAfterOrder } from "@/lib/cart-clear";
import { getCartIdentity } from "@/lib/cart-identity";
import { loadCheckoutCart, type CheckoutCart } from "@/lib/checkout";
import { checkoutCopy } from "@/lib/copy/checkout";
import { couponCopy } from "@/lib/copy/coupons";
import { checkCoupon } from "@/lib/coupons";
import { sendAdminNewOrderEmail, sendOrderReceivedEmail } from "@/lib/order-emails";
import { nextOrderNumber } from "@/lib/order-number";
import { orderAccessToken } from "@/lib/order-token";
import { getCardGateway } from "@/lib/payments";
import type { ShippingAddress } from "@/lib/payments/types";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/rate-limit";
import { clientIp, requestOrigin } from "@/lib/request-context";
import {
  CARD_HOLD_MS,
  InsufficientStockError,
  MANUAL_HOLD_MS,
  releaseOrderReservations,
  reserveStock,
} from "@/lib/stock";

export type CheckoutFormState = { error: string | null };

const checkoutSchema = z.object({
  fullName: z.string().trim().min(3, checkoutCopy.nameRequired).max(100, checkoutCopy.invalidInput),
  email: z.email(checkoutCopy.invalidEmail).max(200, checkoutCopy.invalidEmail),
  phone: z.string().trim().min(10, checkoutCopy.phoneRequired).max(20, checkoutCopy.invalidInput),
  address: z
    .string()
    .trim()
    .min(10, checkoutCopy.addressRequired)
    .max(500, checkoutCopy.invalidInput),
  city: z.string().trim().min(2, checkoutCopy.cityRequired).max(50, checkoutCopy.invalidInput),
  district: z
    .string()
    .trim()
    .min(2, checkoutCopy.districtRequired)
    .max(50, checkoutCopy.invalidInput),
  postalCode: z.string().trim().max(10, checkoutCopy.invalidInput).default(""),
  notes: z.string().trim().max(500, checkoutCopy.invalidInput).default(""),
  paymentMethod: z.enum(["card", "manual"], { message: checkoutCopy.invalidInput }),
  // Mesafeli Sözleşmeler Yönetmeliği: the seller must prove pre-purchase
  // information was confirmed — the consent checkbox is not optional UI.
  legalConsent: z.literal("on", { message: checkoutCopy.consentRequired }),
});

function confirmationPath(orderId: string): string {
  return `/checkout/confirmation?order=${orderId}&token=${orderAccessToken(orderId)}`;
}

function toShippingAddress(input: z.infer<typeof checkoutSchema>): ShippingAddress {
  return {
    fullName: input.fullName,
    phone: input.phone,
    address: input.address,
    city: input.city,
    district: input.district,
    ...(input.postalCode ? { postalCode: input.postalCode } : {}),
  };
}

// Creates the order and reserves tracked stock atomically (R26): if another
// pending order holds the last units, the whole creation rolls back and the
// customer sees the "cart changed" flow. Returns null in that case.
async function createPendingOrder(
  cart: CheckoutCart,
  input: z.infer<typeof checkoutSchema>,
  userId: string | null,
  provider: string,
  holdMs: number,
  couponIdentityEmail: string,
) {
  const shippingAddress = toShippingAddress(input);
  const orderNumber = await nextOrderNumber();

  try {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          email: input.email.toLowerCase(),
          status: "PENDING_PAYMENT",
          subtotalCents: cart.subtotalCents,
          discountCents: cart.discountCents,
          couponCode: cart.coupon?.code ?? null,
          couponDiscountCents: cart.coupon?.discountCents ?? 0,
          shippingCents: cart.shippingCents,
          totalCents: cart.totalCents,
          kdvRatePercent: cart.settings.kdvRatePercent,
          shippingAddress,
          notes: input.notes || null,
          paymentProvider: provider,
          ...(cart.coupon
            ? {
                couponRedemption: {
                  create: { couponId: cart.coupon.couponId, email: couponIdentityEmail },
                },
              }
            : {}),
          items: {
            create: cart.lines.map((line) => ({
              variantId: line.variantId,
              productNameSnapshot: line.productName,
              variantLabelSnapshot: line.variantLabel ?? "",
              unitPriceCents: line.unitCents,
              quantity: line.quantity,
              lineTotalCents: line.lineCents,
            })),
          },
        },
        select: { id: true },
      });
      await reserveStock(
        tx,
        order.id,
        cart.lines.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
        holdMs,
      );
      return order;
    });
  } catch (error) {
    if (error instanceof InsufficientStockError) return null;
    throw error;
  }
}

export async function placeOrder(
  _prev: CheckoutFormState,
  formData: FormData,
): Promise<CheckoutFormState> {
  const parsed = checkoutSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    city: formData.get("city"),
    district: formData.get("district"),
    postalCode: formData.get("postalCode"),
    notes: formData.get("notes"),
    paymentMethod: formData.get("paymentMethod"),
    legalConsent: formData.get("legalConsent"),
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? checkoutCopy.invalidInput };

  const ip = await clientIp();
  if (!consumeRateLimit(`checkout:${ip}`, 10, 10 * 60 * 1000))
    return { error: checkoutCopy.tooManyAttempts };

  const cartResult = await loadCheckoutCart();
  if (!cartResult.ok) {
    if (cartResult.reason === "changed") {
      refresh();
      return { error: checkoutCopy.cartChanged };
    }
    return { error: checkoutCopy.cartEmpty };
  }
  const { cart } = cartResult;

  const gateway = getCardGateway();
  const method = parsed.data.paymentMethod;
  if (method === "card" && !gateway) return { error: checkoutCopy.noPaymentMethod };
  if (method === "manual" && !cart.settings.manualPaymentEnabled)
    return { error: checkoutCopy.noPaymentMethod };

  // R23: a stale coupon must never silently change the charged amount —
  // clear it and let the customer see the summary without it before retrying.
  const dropCoupon = async () => {
    const identity = await getCartIdentity();
    if (identity) await prisma.cart.updateMany({ where: identity, data: { couponCode: null } });
    refresh();
  };
  if (cart.couponError) {
    await dropCoupon();
    return { error: couponCopy.invalidAtCheckout };
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;
  // R23 once-per-customer identity: bind to the ACCOUNT for logged-in users
  // (the session email is immutable within the request, so the form email
  // cannot be varied to farm an uncapped code) and to the submitted email for
  // guests. Must match loadCheckoutCart, which checks logged-in carts against
  // accountEmail() — and the redemption row is stored under the same identity.
  const couponIdentityEmail = (session?.user?.email ?? parsed.data.email).toLowerCase();

  if (cart.coupon) {
    const recheck = await checkCoupon(cart.coupon.code, cart.subtotalCents, couponIdentityEmail);
    if (!recheck.ok) {
      await dropCoupon();
      return { error: recheck.error };
    }
  }

  // R19 save-at-checkout: best-effort and independent of the payment outcome.
  if (userId && formData.get("saveAddress") === "on")
    await saveAddressFromCheckout(userId, toShippingAddress(parsed.data));

  if (method === "manual") {
    const order = await createPendingOrder(
      cart,
      parsed.data,
      userId,
      "manual",
      MANUAL_HOLD_MS,
      couponIdentityEmail,
    );
    if (!order) {
      refresh();
      return { error: checkoutCopy.cartChanged };
    }
    await clearCartAfterOrder(userId);
    after(() =>
      Promise.all([sendOrderReceivedEmail(order.id), sendAdminNewOrderEmail(order.id, "placed")]),
    );
    refresh();
    redirect(confirmationPath(order.id));
  }

  const order = await createPendingOrder(
    cart,
    parsed.data,
    userId,
    gateway!.id,
    CARD_HOLD_MS,
    couponIdentityEmail,
  );
  if (!order) {
    refresh();
    return { error: checkoutCopy.cartChanged };
  }
  let init;
  try {
    init = await gateway!.initPayment(
      {
        id: order.id,
        email: parsed.data.email.toLowerCase(),
        buyerIp: ip,
        subtotalCents: cart.subtotalCents,
        totalCents: cart.totalCents,
        shippingAddress: toShippingAddress(parsed.data),
        items: cart.lines.map((line) => ({
          variantId: line.variantId,
          name: line.variantLabel ? `${line.productName} (${line.variantLabel})` : line.productName,
          quantity: line.quantity,
          lineCents: line.lineCents,
        })),
      },
      `${await requestOrigin()}/api/payments/iyzico/callback`,
    );
  } catch (error) {
    console.error("payment init threw", error);
    init = { ok: false as const };
  }

  if (!init.ok) {
    // Nothing was charged; the cart is untouched, the order leaves the flow
    // and its stock hold is released.
    await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
    await releaseOrderReservations(order.id);
    return { error: checkoutCopy.paymentInitFailed };
  }

  await prisma.order.update({ where: { id: order.id }, data: { paymentRef: init.paymentRef } });
  redirect(init.redirectUrl);
}
