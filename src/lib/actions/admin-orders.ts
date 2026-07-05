"use server";

import { refresh, updateTag as invalidateTag } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-guard";
import { adminCopy, adminOrdersCopy } from "@/lib/copy/admin";
import { sendOrderPaidEmail } from "@/lib/order-emails";
import { markOrderPaid } from "@/lib/order-paid";
import { prisma } from "@/lib/prisma";
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

export async function cancelOrderAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await assertAdmin();

  const id = z.string().min(1).safeParse(formData.get("id"));
  if (!id.success) return fail(adminCopy.common.invalidInput);

  // Only never-paid orders can be cancelled here — stock was not decremented
  // for them, so no restock logic is needed (refund flows are Phase 2).
  const cancelled = await prisma.order.updateMany({
    where: { id: id.data, status: "PENDING_PAYMENT" },
    data: { status: "CANCELLED" },
  });
  if (cancelled.count === 0) return fail(adminOrdersCopy.alreadyTransitioned);

  refresh();
  return { error: null, saved: true };
}
