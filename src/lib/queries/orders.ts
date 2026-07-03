import { prisma } from "@/lib/prisma";

// Per-user data: never "use cache".

export type ConfirmationOrder = {
  id: string;
  orderNumber: string;
  status: "PENDING_PAYMENT" | "PAID" | "CANCELLED" | "FULFILLED";
  paymentProvider: string | null;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  items: { id: string; name: string; label: string; quantity: number; lineTotalCents: number }[];
};

export async function getConfirmationOrder(orderId: string): Promise<ConfirmationOrder | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentProvider: true,
      subtotalCents: true,
      discountCents: true,
      shippingCents: true,
      totalCents: true,
      items: {
        select: {
          id: true,
          productNameSnapshot: true,
          variantLabelSnapshot: true,
          quantity: true,
          lineTotalCents: true,
        },
      },
    },
  });
  if (!order) return null;

  return {
    ...order,
    items: order.items.map((item) => ({
      id: item.id,
      name: item.productNameSnapshot,
      label: item.variantLabelSnapshot,
      quantity: item.quantity,
      lineTotalCents: item.lineTotalCents,
    })),
  };
}

export type UserOrderSummary = {
  id: string;
  orderNumber: string;
  status: "PENDING_PAYMENT" | "PAID" | "CANCELLED" | "FULFILLED";
  totalCents: number;
  placedAt: Date;
  itemCount: number;
};

export async function getOrdersForUser(userId: string): Promise<UserOrderSummary[]> {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { placedAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalCents: true,
      placedAt: true,
      items: { select: { quantity: true } },
    },
  });

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    totalCents: order.totalCents,
    placedAt: order.placedAt,
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
  }));
}
