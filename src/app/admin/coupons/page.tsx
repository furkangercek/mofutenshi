import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin-guard";
import { adminCouponsCopy } from "@/lib/copy/coupons";
import { istanbulDateTimeFormatter } from "@/lib/datetime";
import { formatKurus } from "@/lib/money";
import { getCouponsForAdmin, type AdminCouponRow } from "@/lib/queries/coupons";

export const metadata: Metadata = { title: adminCouponsCopy.title };

function couponStatus(coupon: AdminCouponRow, now: Date): string {
  if (!coupon.isActive) return adminCouponsCopy.statusInactive;
  if (now < coupon.startsAt) return adminCouponsCopy.statusPlanned;
  if (now > coupon.endsAt) return adminCouponsCopy.statusExpired;
  return adminCouponsCopy.statusActive;
}

export default async function AdminCouponsPage() {
  await requireAdmin("/admin/coupons");
  const coupons = await getCouponsForAdmin();
  const now = new Date();

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl">{adminCouponsCopy.title}</h1>
        <ButtonLink href="/admin/coupons/new">{adminCouponsCopy.newCta}</ButtonLink>
      </div>

      {coupons.length === 0 ? (
        <p className="text-muted mt-6">{adminCouponsCopy.empty}</p>
      ) : (
        <ul className="border-border bg-surface divide-border mt-6 divide-y rounded-lg border">
          {coupons.map((coupon) => (
            <li key={coupon.id}>
              <Link
                href={`/admin/coupons/${coupon.id}`}
                className="hover:bg-ghost flex items-baseline justify-between gap-3 rounded-md px-4 py-3 transition"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium">
                    {coupon.code} · {couponStatus(coupon, now)}
                  </span>
                  <span className="text-muted block text-sm">
                    {istanbulDateTimeFormatter.format(coupon.startsAt)} –{" "}
                    {istanbulDateTimeFormatter.format(coupon.endsAt)} ·{" "}
                    {adminCouponsCopy.usedSummary(coupon.usedCount, coupon.maxRedemptions)}
                    {coupon.minSubtotalCents > 0
                      ? ` · ${adminCouponsCopy.minSummary(formatKurus(coupon.minSubtotalCents))}`
                      : ""}
                  </span>
                </span>
                <span className="text-sm font-semibold whitespace-nowrap">
                  {adminCouponsCopy.percentValue(coupon.percentOff)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
