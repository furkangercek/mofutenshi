import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CouponForm } from "@/components/admin/coupon-form";
import { requireAdmin } from "@/lib/admin-guard";
import { adminCouponsCopy } from "@/lib/copy/coupons";
import { toIstanbulInputValue } from "@/lib/datetime";
import { kurusToInputValue } from "@/lib/money";
import { getCouponForAdmin } from "@/lib/queries/coupons";

export const metadata: Metadata = { title: adminCouponsCopy.editTitle };

export default async function EditCouponPage({
  params,
}: {
  params: Promise<{ couponId: string }>;
}) {
  const { couponId } = await params;
  await requireAdmin(`/admin/coupons/${couponId}`);

  const coupon = await getCouponForAdmin(couponId);
  if (!coupon) notFound();

  return (
    <div>
      <h1 className="font-display text-3xl">{adminCouponsCopy.editTitle}</h1>
      <p className="text-muted mt-2 text-sm">
        {adminCouponsCopy.usedSummary(coupon.usedCount, coupon.maxRedemptions)}
      </p>
      <div className="mt-6">
        <CouponForm
          defaults={{
            id: coupon.id,
            code: coupon.code,
            percentOff: String(coupon.percentOff),
            startsAt: toIstanbulInputValue(coupon.startsAt),
            endsAt: toIstanbulInputValue(coupon.endsAt),
            minSubtotal:
              coupon.minSubtotalCents > 0 ? kurusToInputValue(coupon.minSubtotalCents) : "",
            maxRedemptions: coupon.maxRedemptions === null ? "" : String(coupon.maxRedemptions),
            isActive: coupon.isActive,
          }}
        />
      </div>
    </div>
  );
}
