import { prisma } from "@/lib/prisma";
import { releaseOrderReservations } from "@/lib/stock";

// The single PENDING_PAYMENT → PAID transition, used by the gateway callback
// now and by admin manual-payment confirmation at step 8. Stock decrements
// ONLY here (CLAUDE.md hard rule) and only once: the guard update makes
// duplicate callbacks no-ops. Made-to-order variants (R26) have no stock to
// decrement; the order's reservations are released in the same transaction.
export async function markOrderPaid(orderId: string, paymentRef: string | null): Promise<boolean> {
  const items = await prisma.orderItem.findMany({
    where: { orderId },
    select: { variantId: true, quantity: true, variant: { select: { trackStock: true } } },
  });

  return prisma.$transaction(async (tx) => {
    const flipped = await tx.order.updateMany({
      where: { id: orderId, status: "PENDING_PAYMENT" },
      data: { status: "PAID", paidAt: new Date(), ...(paymentRef ? { paymentRef } : {}) },
    });
    if (flipped.count === 0) return false;

    for (const item of items) {
      if (!item.variantId || !item.variant?.trackStock) continue;
      const decremented = await tx.variant.updateMany({
        where: { id: item.variantId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (decremented.count === 0) {
        // Oversold between order creation and payment (reservation expired
        // and the stock went elsewhere) — clamp and flag for the owner.
        console.error(`oversell on variant ${item.variantId} for order ${orderId}`);
        await tx.variant.update({ where: { id: item.variantId }, data: { stock: 0 } });
      }
    }
    await releaseOrderReservations(orderId, tx);
    return true;
  });
}
