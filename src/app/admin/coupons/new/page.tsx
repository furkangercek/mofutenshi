import type { Metadata } from "next";
import { CouponForm } from "@/components/admin/coupon-form";
import { requireAdmin } from "@/lib/admin-guard";
import { adminCouponsCopy } from "@/lib/copy/coupons";
import { toIstanbulInputValue } from "@/lib/datetime";

export const metadata: Metadata = { title: adminCouponsCopy.newTitle };

export default async function NewCouponPage() {
  await requireAdmin("/admin/coupons/new");

  const now = new Date();
  const inThirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return (
    <div>
      <h1 className="font-display text-3xl">{adminCouponsCopy.newTitle}</h1>
      <div className="mt-6">
        <CouponForm
          defaults={{
            code: "",
            percentOff: "",
            startsAt: toIstanbulInputValue(now),
            endsAt: toIstanbulInputValue(inThirtyDays),
            minSubtotal: "",
            maxRedemptions: "",
            isActive: true,
          }}
        />
      </div>
    </div>
  );
}
