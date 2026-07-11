"use server";

import { refresh, updateTag as invalidateTag } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-guard";
import { adminCopy, adminOrdersCopy } from "@/lib/copy/admin";
import { sendOrderPaidEmail, sendOrderShippedEmail } from "@/lib/order-emails";
import { markOrderPaid } from "@/lib/order-paid";
import { prisma } from "@/lib/prisma";
import { releaseOrderReservations } from "@/lib/stock";
import type { AdminFormState } from "@/lib/actions/admin-settings";

function fail(error: string): AdminFormState {
  return { error, saved: false };
}

// Manual (havale/EFT) confirmation goes through markOrderPaid — the single
// PENDING_PAYMENT → PAID transition and the only place stock decrements.
export async function confirmOrderPaidAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const admin = await assertAdmin();

  const id = z.string().min(1).safeParse(formData.get("id"));
  if (!id.success) return fail(adminCopy.common.invalidInput);

  const flipped = await markOrderPaid(id.data, `manual-admin:${admin.id}`);
  if (!flipped) return fail(adminOrdersCopy.alreadyTransitioned);

  after(() => sendOrderPaidEmail(id.data));

  // Stock changed on PAID; storefront availability must follow.
  invalidateTag("catalog");
  refresh();
  return { error: null, saved: true };
}

const fulfillSchema = z.object({
  id: z.string().min(1),
  carrier: z.string().trim().max(100).default(""),
  trackingNumber: z.string().trim().max(100).default(""),
});

// PAID → FULFILLED (R13). Stock is untouched — it already dropped on PAID.
export async function fulfillOrderAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await assertAdmin();

  const parsed = fulfillSchema.safeParse({
    id: formData.get("id"),
    carrier: formData.get("carrier"),
    trackingNumber: formData.get("trackingNumber"),
  });
  if (!parsed.success) return fail(adminCopy.common.invalidInput);

  const fulfilled = await prisma.order.updateMany({
    where: { id: parsed.data.id, status: "PAID" },
    data: {
      status: "FULFILLED",
      carrier: parsed.data.carrier || null,
      trackingNumber: parsed.data.trackingNumber || null,
      shippedAt: new Date(),
    },
  });
  if (fulfilled.count === 0) return fail(adminOrdersCopy.alreadyTransitioned);

  after(() => sendOrderShippedEmail(parsed.data.id));

  refresh();
  return { error: null, saved: true };
}

// PAID → CANCELLED with restock (R14). The refund itself is manual — the
// system never moves money.
export async function cancelPaidOrderAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await assertAdmin();

  const id = z.string().min(1).safeParse(formData.get("id"));
  if (!id.success) return fail(adminCopy.common.invalidInput);

  const items = await prisma.orderItem.findMany({
    where: { orderId: id.data },
    select: { variantId: true, quantity: true, variant: { select: { trackStock: true } } },
  });

  const cancelled = await prisma.$transaction(async (tx) => {
    const flipped = await tx.order.updateMany({
      where: { id: id.data, status: "PAID" },
      data: { status: "CANCELLED" },
    });
    if (flipped.count === 0) return false;

    // Mirror of markOrderPaid's decrement; deleted variants (null) are gone
    // from the catalog and made-to-order variants (R26) were never
    // decremented, so neither gets anything back.
    for (const item of items) {
      if (!item.variantId || !item.variant?.trackStock) continue;
      await tx.variant.updateMany({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } },
      });
    }
    return true;
  });
  if (!cancelled) return fail(adminOrdersCopy.alreadyTransitioned);

  // Restocked variants must reappear on the storefront.
  invalidateTag("catalog");
  refresh();
  return { error: null, saved: true };
}

export async function cancelOrderAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await assertAdmin();

  const id = z.string().min(1).safeParse(formData.get("id"));
  if (!id.success) return fail(adminCopy.common.invalidInput);

  // Only never-paid orders can be cancelled here — stock was not decremented
  // for them, so no restock logic is needed (refund flows are Phase 2). Their
  // reservation hold (R26) is released so the stock frees immediately.
  const cancelled = await prisma.order.updateMany({
    where: { id: id.data, status: "PENDING_PAYMENT" },
    data: { status: "CANCELLED" },
  });
  if (cancelled.count === 0) return fail(adminOrdersCopy.alreadyTransitioned);
  await releaseOrderReservations(id.data);

  refresh();
  return { error: null, saved: true };
}
