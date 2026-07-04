import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin-guard";
import { adminSalesCopy } from "@/lib/copy/admin";
import { istanbulDateTimeFormatter } from "@/lib/datetime";
import { formatKurus } from "@/lib/money";
import { getAdminSales, type AdminSaleRow } from "@/lib/queries/admin";

export const metadata: Metadata = { title: adminSalesCopy.title };

function saleStatus(sale: AdminSaleRow, now: Date): string {
  if (sale.endedEarly) return adminSalesCopy.statusEndedEarly;
  if (now < sale.startsAt) return adminSalesCopy.statusPlanned;
  if (now > sale.endsAt) return adminSalesCopy.statusEnded;
  return adminSalesCopy.statusActive;
}

export default async function AdminSalesPage() {
  await requireAdmin("/admin/sales");
  const sales = await getAdminSales();
  const now = new Date();

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl">{adminSalesCopy.title}</h1>
        <ButtonLink href="/admin/sales/new">{adminSalesCopy.newCta}</ButtonLink>
      </div>

      {sales.length === 0 ? (
        <p className="text-muted mt-6">{adminSalesCopy.empty}</p>
      ) : (
        <ul className="border-border bg-surface divide-border mt-6 divide-y rounded-lg border">
          {sales.map((sale) => (
            <li key={sale.id}>
              <Link
                href={`/admin/sales/${sale.id}`}
                className="hover:bg-ghost flex items-baseline justify-between gap-3 rounded-md px-4 py-3 transition"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium">
                    {sale.name} · {saleStatus(sale, now)}
                  </span>
                  <span className="text-muted block text-sm">
                    {istanbulDateTimeFormatter.format(sale.startsAt)} –{" "}
                    {istanbulDateTimeFormatter.format(sale.endsAt)} ·{" "}
                    {adminSalesCopy.scopeSummary(sale.productCount, sale.tagCount)}
                  </span>
                </span>
                <span className="text-sm font-semibold whitespace-nowrap">
                  {sale.type === "PERCENT"
                    ? adminSalesCopy.percentValue(sale.value)
                    : `−${formatKurus(sale.value)}`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
