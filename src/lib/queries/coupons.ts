import { prisma } from "@/lib/prisma";

// Admin reads are always fresh: never "use cache".

// A redemption counts while its order is not CANCELLED (mirrors checkCoupon).
const activeRedemptionCount = {
  select: { redemptions: { where: { order: { status: { not: "CANCELLED" as const } } } } },
};

export type AdminCouponRow = {
  id: string;
  code: string;
  percentOff: number;
  startsAt: Date;
  endsAt: Date;
  minSubtotalCents: number;
  maxRedemptions: number | null;
  isActive: boolean;
  usedCount: number;
};

export async function getCouponsForAdmin(): Promise<AdminCouponRow[]> {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      code: true,
      percentOff: true,
      startsAt: true,
      endsAt: true,
      minSubtotalCents: true,
      maxRedemptions: true,
      isActive: true,
      _count: activeRedemptionCount,
    },
  });
  return coupons.map(({ _count, ...coupon }) => ({ ...coupon, usedCount: _count.redemptions }));
}

export async function getCouponForAdmin(id: string): Promise<AdminCouponRow | null> {
  const coupon = await prisma.coupon.findUnique({
    where: { id },
    select: {
      id: true,
      code: true,
      percentOff: true,
      startsAt: true,
      endsAt: true,
      minSubtotalCents: true,
      maxRedemptions: true,
      isActive: true,
      _count: activeRedemptionCount,
    },
  });
  if (!coupon) return null;
  const { _count, ...rest } = coupon;
  return { ...rest, usedCount: _count.redemptions };
}
