import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

// R26 stock reservations. Availability = stock − active (unexpired)
// reservations; tracked variants are held from order creation until the
// order resolves (PAID deletes the hold and decrements, cancel just deletes,
// expiry frees the stock by falling out of the sums). Made-to-order variants
// (trackStock = false) never participate.

export const CARD_HOLD_MS = 30 * 60 * 1000; // the iyzico payment window
export const MANUAL_HOLD_MS = 24 * 60 * 60 * 1000; // havale/EFT transfer time

export type ReserveLine = { variantId: string; quantity: number };

export class InsufficientStockError extends Error {
  constructor(variantId: string) {
    super(`insufficient available stock for variant ${variantId}`);
  }
}

type Tx = Prisma.TransactionClient;

// Non-locking read for checkout validation: active reserved quantity per
// variant. The authoritative check re-runs under row locks in reserveStock.
export async function activeReservationTotals(variantIds: string[]): Promise<Map<string, number>> {
  if (variantIds.length === 0) return new Map();
  const groups = await prisma.stockReservation.groupBy({
    by: ["variantId"],
    where: { variantId: { in: variantIds }, expiresAt: { gt: new Date() } },
    _sum: { quantity: true },
  });
  return new Map(groups.map((group) => [group.variantId, group._sum.quantity ?? 0]));
}

// Must run INSIDE the order-creation transaction. Locks the variant rows
// (sorted, to keep concurrent orders deadlock-free), drops expired holds,
// re-checks availability, and creates this order's reservations. Throws
// InsufficientStockError to roll the whole order back.
export async function reserveStock(
  tx: Tx,
  orderId: string,
  lines: ReserveLine[],
  holdMs: number,
): Promise<void> {
  const ids = [...new Set(lines.map((line) => line.variantId))].sort();
  if (ids.length === 0) return;

  const now = new Date();
  const locked = await tx.$queryRaw<{ id: string; stock: number; trackStock: boolean }[]>`
    SELECT "id", "stock", "trackStock" FROM "Variant"
    WHERE "id" IN (${Prisma.join(ids)})
    ORDER BY "id" FOR UPDATE`;
  const variants = new Map(locked.map((variant) => [variant.id, variant]));

  await tx.stockReservation.deleteMany({
    where: { variantId: { in: ids }, expiresAt: { lte: now } },
  });
  const reserved = await tx.stockReservation.groupBy({
    by: ["variantId"],
    where: { variantId: { in: ids } },
    _sum: { quantity: true },
  });
  const reservedByVariant = new Map(
    reserved.map((group) => [group.variantId, group._sum.quantity ?? 0]),
  );

  const holds: { orderId: string; variantId: string; quantity: number; expiresAt: Date }[] = [];
  for (const line of lines) {
    const variant = variants.get(line.variantId);
    if (!variant) throw new InsufficientStockError(line.variantId);
    if (!variant.trackStock) continue;
    const available = variant.stock - (reservedByVariant.get(line.variantId) ?? 0);
    if (line.quantity > available) throw new InsufficientStockError(line.variantId);
    holds.push({
      orderId,
      variantId: line.variantId,
      quantity: line.quantity,
      expiresAt: new Date(now.getTime() + holdMs),
    });
  }
  if (holds.length > 0) await tx.stockReservation.createMany({ data: holds });
}

// Idempotent: releasing an order with no holds is a no-op.
export async function releaseOrderReservations(orderId: string, tx: Tx = prisma): Promise<void> {
  await tx.stockReservation.deleteMany({ where: { orderId } });
}
