import type { Metadata } from "next";
import Link from "next/link";
import { ButtonSecondary } from "@/components/ui/button";
import { inputClass } from "@/components/ui/form";
import { requireAdmin } from "@/lib/admin-guard";
import { adminOrdersCopy } from "@/lib/copy/admin";
import { accountOrdersCopy } from "@/lib/copy/checkout";
import { formatKurus } from "@/lib/money";
import { getAdminOrders } from "@/lib/queries/admin";

export const metadata: Metadata = { title: adminOrdersCopy.title };

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "medium",
  timeStyle: "short",
});

const statuses = ["PENDING_PAYMENT", "PAID", "CANCELLED", "FULFILLED"] as const;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin("/admin/orders");
  const { status } = await searchParams;
  const activeStatus = statuses.find((s) => s === status);

  const orders = await getAdminOrders(activeStatus);

  return (
    <div>
      <h1 className="font-display text-3xl">{adminOrdersCopy.title}</h1>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <label className="block text-sm font-medium">
          <span className="sr-only">{adminOrdersCopy.filterLabel}</span>
          <select
            name="status"
            defaultValue={activeStatus ?? ""}
            className={`${inputClass} mt-0 w-52`}
          >
            <option value="">{adminOrdersCopy.filterAll}</option>
            {statuses.map((value) => (
              <option key={value} value={value}>
                {accountOrdersCopy.statusLabels[value]}
              </option>
            ))}
          </select>
        </label>
        <ButtonSecondary type="submit" className="text-sm">
          {adminOrdersCopy.filterCta}
        </ButtonSecondary>
      </form>

      {orders.length === 0 ? (
        <p className="text-muted mt-6">{adminOrdersCopy.empty}</p>
      ) : (
        <ul className="border-border bg-surface divide-border mt-6 divide-y rounded-lg border">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/admin/orders/${order.id}`}
                className="hover:bg-ghost flex items-baseline justify-between gap-3 rounded-md px-4 py-3 transition"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium">
                    {order.orderNumber} · {accountOrdersCopy.statusLabels[order.status]}
                  </span>
                  <span className="text-muted block truncate text-sm">
                    {dateFormatter.format(order.placedAt)} · {order.email} ·{" "}
                    {adminOrdersCopy.itemCount(order.itemCount)}
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
    </div>
  );
}
