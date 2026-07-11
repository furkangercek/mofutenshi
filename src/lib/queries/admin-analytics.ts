import { prisma } from "@/lib/prisma";

// Admin reads are always fresh — never "use cache" (see admin.ts).
//
// Revenue = charged amounts (totalCents: post-coupon, shipping included) of
// PAID/FULFILLED orders, windowed by placedAt — the same status/timestamp
// convention as the R20 best-seller ranking, so the two surfaces agree.
// Days are bucketed in store time (Europe/Istanbul, fixed UTC+3).

export const ANALYTICS_PERIODS = [7, 30, 90] as const;
export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number];

export type AdminAnalytics = {
  periodDays: AnalyticsPeriod;
  revenueCents: number;
  orderCount: number;
  averageOrderCents: number;
  unitsSold: number;
  couponOrderCount: number;
  couponDiscountCents: number;
  statusCounts: Record<"PENDING_PAYMENT" | "PAID" | "FULFILLED" | "CANCELLED", number>;
  dailyRevenue: { date: Date; revenueCents: number; orderCount: number }[];
  topProducts: { name: string; units: number; revenueCents: number }[];
};

const istanbulDay = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Istanbul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function startOfIstanbulDay(date: Date, daysBack = 0): Date {
  const day = new Date(`${istanbulDay.format(date)}T00:00:00+03:00`);
  day.setUTCDate(day.getUTCDate() - daysBack);
  return day;
}

export async function getAdminAnalytics(periodDays: AnalyticsPeriod): Promise<AdminAnalytics> {
  const now = new Date();
  // Window = the trailing periodDays Istanbul days, today included.
  const since = startOfIstanbulDay(now, periodDays - 1);

  const [orders, unitAgg, itemGroups, statusGroups] = await Promise.all([
    prisma.order.findMany({
      where: { status: { in: ["PAID", "FULFILLED"] }, placedAt: { gte: since } },
      select: { placedAt: true, totalCents: true, couponCode: true, couponDiscountCents: true },
    }),
    prisma.orderItem.aggregate({
      where: { order: { status: { in: ["PAID", "FULFILLED"] }, placedAt: { gte: since } } },
      _sum: { quantity: true },
    }),
    // Grouped by name snapshot so deleted products still report; a renamed
    // product splits into two rows, accepted for a small catalog.
    prisma.orderItem.groupBy({
      by: ["productNameSnapshot"],
      where: { order: { status: { in: ["PAID", "FULFILLED"] }, placedAt: { gte: since } } },
      _sum: { quantity: true, lineTotalCents: true },
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: { placedAt: { gte: since } },
      _count: true,
    }),
  ]);

  const revenueCents = orders.reduce((sum, order) => sum + order.totalCents, 0);
  const couponOrders = orders.filter((order) => order.couponCode !== null);

  const revenueByDay = new Map<string, { revenueCents: number; orderCount: number }>();
  for (const order of orders) {
    const key = istanbulDay.format(order.placedAt);
    const bucket = revenueByDay.get(key) ?? { revenueCents: 0, orderCount: 0 };
    bucket.revenueCents += order.totalCents;
    bucket.orderCount += 1;
    revenueByDay.set(key, bucket);
  }
  const dailyRevenue = Array.from({ length: periodDays }, (_, index) => {
    const date = startOfIstanbulDay(now, periodDays - 1 - index);
    const bucket = revenueByDay.get(istanbulDay.format(date));
    return {
      date,
      revenueCents: bucket?.revenueCents ?? 0,
      orderCount: bucket?.orderCount ?? 0,
    };
  });

  const statusCounts = {
    PENDING_PAYMENT: 0,
    PAID: 0,
    FULFILLED: 0,
    CANCELLED: 0,
  };
  for (const group of statusGroups) statusCounts[group.status] = group._count;

  return {
    periodDays,
    revenueCents,
    orderCount: orders.length,
    averageOrderCents: orders.length > 0 ? Math.floor(revenueCents / orders.length) : 0,
    unitsSold: unitAgg._sum.quantity ?? 0,
    couponOrderCount: couponOrders.length,
    couponDiscountCents: couponOrders.reduce((sum, order) => sum + order.couponDiscountCents, 0),
    statusCounts,
    dailyRevenue,
    topProducts: itemGroups
      .map((group) => ({
        name: group.productNameSnapshot,
        units: group._sum.quantity ?? 0,
        revenueCents: group._sum.lineTotalCents ?? 0,
      }))
      .sort((a, b) => b.revenueCents - a.revenueCents || b.units - a.units)
      .slice(0, 10),
  };
}
