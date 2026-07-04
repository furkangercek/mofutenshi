import Link from "next/link";
import { requireAdmin } from "@/lib/admin-guard";
import { adminDashboardCopy } from "@/lib/copy/admin";
import { accountOrdersCopy } from "@/lib/copy/checkout";
import { formatKurus } from "@/lib/money";
import { getAdminDashboard } from "@/lib/queries/admin";

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "medium",
  timeStyle: "short",
});

function StatCard({
  href,
  label,
  value,
  hint,
}: {
  href: string;
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <Link
      href={href}
      className="border-border bg-surface hover:border-ring block rounded-lg border p-4 transition"
    >
      <span className="text-muted block text-sm">{label}</span>
      <span className="font-display mt-1 block text-3xl">{value}</span>
      {hint ? <span className="text-muted mt-1 block text-xs">{hint}</span> : null}
    </Link>
  );
}

export default async function AdminDashboardPage() {
  await requireAdmin();
  const dashboard = await getAdminDashboard();

  return (
    <div>
      <h1 className="font-display text-3xl">{adminDashboardCopy.title}</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          href="/admin/products"
          label={adminDashboardCopy.products}
          value={dashboard.publishedCount + dashboard.draftCount}
          hint={adminDashboardCopy.productsPublished(
            dashboard.publishedCount,
            dashboard.draftCount,
          )}
        />
        <StatCard
          href="/admin/sales"
          label={adminDashboardCopy.activeSales}
          value={dashboard.activeSalesCount}
        />
        <StatCard
          href="/admin/inventory"
          label={adminDashboardCopy.lowStock}
          value={dashboard.lowStockCount}
          hint={adminDashboardCopy.lowStockHint(dashboard.lowStockThreshold)}
        />
        <StatCard
          href="/admin/orders"
          label={adminDashboardCopy.pendingOrders}
          value={dashboard.pendingOrdersCount}
          hint={adminDashboardCopy.pendingOrdersHint}
        />
      </div>

      <section className="border-border bg-surface mt-8 rounded-lg border p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-xl">{adminDashboardCopy.recentOrdersHeading}</h2>
          <Link
            href="/admin/orders"
            className="text-muted hover:text-ink text-sm underline underline-offset-4"
          >
            {adminDashboardCopy.viewAll}
          </Link>
        </div>
        {dashboard.recentOrders.length === 0 ? (
          <p className="text-muted mt-3 text-sm">{adminDashboardCopy.recentOrdersEmpty}</p>
        ) : (
          <ul className="divide-border mt-2 divide-y">
            {dashboard.recentOrders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="hover:bg-ghost -mx-2 flex items-baseline justify-between gap-3 rounded-md px-2 py-3 transition"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">
                      {order.orderNumber} · {accountOrdersCopy.statusLabels[order.status]}
                    </span>
                    <span className="text-muted block truncate text-sm">
                      {dateFormatter.format(order.placedAt)} · {order.email}
                    </span>
                  </span>
                  <span className="text-sm font-semibold whitespace-nowrap">
                    {formatKurus(order.totalCents)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
