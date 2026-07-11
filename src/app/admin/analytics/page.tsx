import type { Metadata } from "next";
import Link from "next/link";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { requireAdmin } from "@/lib/admin-guard";
import { adminAnalyticsCopy } from "@/lib/copy/admin";
import { accountOrdersCopy } from "@/lib/copy/checkout";
import { formatKurus } from "@/lib/money";
import {
  ANALYTICS_PERIODS,
  getAdminAnalytics,
  type AnalyticsPeriod,
} from "@/lib/queries/admin-analytics";

export const metadata: Metadata = { title: adminAnalyticsCopy.title };

function KpiCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="border-border bg-surface rounded-lg border p-4">
      <span className="text-muted block text-sm">{label}</span>
      <span className="font-display mt-1 block text-3xl">{value}</span>
      {hint ? <span className="text-muted mt-1 block text-xs">{hint}</span> : null}
    </div>
  );
}

const statusOrder = ["PENDING_PAYMENT", "PAID", "FULFILLED", "CANCELLED"] as const;

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  await requireAdmin("/admin/analytics");
  const { period } = await searchParams;
  const periodDays: AnalyticsPeriod =
    ANALYTICS_PERIODS.find((days) => String(days) === period) ?? 30;

  const analytics = await getAdminAnalytics(periodDays);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl">{adminAnalyticsCopy.title}</h1>
        <nav aria-label={adminAnalyticsCopy.periodLabel} className="flex gap-2">
          {ANALYTICS_PERIODS.map((days) => (
            <Link
              key={days}
              href={`/admin/analytics?period=${days}`}
              aria-current={days === periodDays ? "page" : undefined}
              className={
                days === periodDays
                  ? "bg-ring rounded-full px-3 py-1 text-sm text-white"
                  : "border-border bg-surface hover:border-ring rounded-full border px-3 py-1 text-sm transition"
              }
            >
              {adminAnalyticsCopy.periodOption(days)}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label={adminAnalyticsCopy.revenue}
          value={formatKurus(analytics.revenueCents)}
          hint={adminAnalyticsCopy.revenueHint}
        />
        <KpiCard
          label={adminAnalyticsCopy.orders}
          value={String(analytics.orderCount)}
          hint={adminAnalyticsCopy.ordersHint}
        />
        <KpiCard
          label={adminAnalyticsCopy.averageOrder}
          value={formatKurus(analytics.averageOrderCents)}
        />
        <KpiCard
          label={adminAnalyticsCopy.unitsSold}
          value={String(analytics.unitsSold)}
          hint={adminAnalyticsCopy.unitsSoldHint}
        />
      </div>

      <section className="border-border bg-surface mt-8 rounded-lg border p-6">
        <h2 className="font-display text-xl">{adminAnalyticsCopy.chartHeading}</h2>
        {analytics.orderCount === 0 ? (
          <p className="text-muted mt-3 text-sm">{adminAnalyticsCopy.chartEmpty}</p>
        ) : (
          <div className="mt-4">
            <RevenueChart points={analytics.dailyRevenue} />
          </div>
        )}
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr]">
        <section className="border-border bg-surface rounded-lg border p-6">
          <h2 className="font-display text-xl">{adminAnalyticsCopy.topProductsHeading}</h2>
          <p className="text-muted mt-1 text-xs">{adminAnalyticsCopy.topProductsHint}</p>
          {analytics.topProducts.length === 0 ? (
            <p className="text-muted mt-3 text-sm">{adminAnalyticsCopy.topProductsEmpty}</p>
          ) : (
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="text-muted border-border border-b text-left">
                  <th className="py-2 font-medium">{adminAnalyticsCopy.productHeader}</th>
                  <th className="py-2 text-right font-medium">{adminAnalyticsCopy.unitsHeader}</th>
                  <th className="py-2 text-right font-medium">
                    {adminAnalyticsCopy.productRevenueHeader}
                  </th>
                </tr>
              </thead>
              <tbody>
                {analytics.topProducts.map((product) => (
                  <tr key={product.name} className="border-border border-b last:border-0">
                    <td className="py-2">{product.name}</td>
                    <td className="py-2 text-right">{product.units}</td>
                    <td className="py-2 text-right font-medium">
                      {formatKurus(product.revenueCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <div className="space-y-8">
          <section className="border-border bg-surface rounded-lg border p-6">
            <h2 className="font-display text-xl">{adminAnalyticsCopy.statusHeading}</h2>
            <p className="text-muted mt-1 text-xs">{adminAnalyticsCopy.statusHint}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {statusOrder.map((status) => (
                <li key={status} className="flex items-baseline justify-between gap-3">
                  <span>{accountOrdersCopy.statusLabels[status]}</span>
                  <span className="font-medium">{analytics.statusCounts[status]}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="border-border bg-surface rounded-lg border p-6">
            <h2 className="font-display text-xl">{adminAnalyticsCopy.couponHeading}</h2>
            {analytics.couponOrderCount === 0 ? (
              <p className="text-muted mt-3 text-sm">{adminAnalyticsCopy.couponEmpty}</p>
            ) : (
              <div className="mt-3 space-y-2 text-sm">
                <p>{adminAnalyticsCopy.couponOrders(analytics.couponOrderCount)}</p>
                <p className="flex items-baseline justify-between gap-3">
                  <span>{adminAnalyticsCopy.couponDiscountLabel}</span>
                  <span className="font-medium">−{formatKurus(analytics.couponDiscountCents)}</span>
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
