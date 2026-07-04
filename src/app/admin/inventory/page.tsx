import type { Metadata } from "next";
import { InventoryTable } from "@/components/admin/inventory-table";
import { requireAdmin } from "@/lib/admin-guard";
import { adminInventoryCopy } from "@/lib/copy/admin";
import { getAdminInventory } from "@/lib/queries/admin";

export const metadata: Metadata = { title: adminInventoryCopy.title };

export default async function AdminInventoryPage() {
  await requireAdmin("/admin/inventory");
  const { rows, lowStockThreshold } = await getAdminInventory();

  return (
    <div>
      <h1 className="font-display text-3xl">{adminInventoryCopy.title}</h1>
      <p className="text-muted mt-2 text-sm">
        {adminInventoryCopy.lowStockNote(lowStockThreshold)}
      </p>
      <div className="mt-6">
        {rows.length === 0 ? (
          <p className="text-muted">{adminInventoryCopy.empty}</p>
        ) : (
          <InventoryTable rows={rows} lowStockThreshold={lowStockThreshold} />
        )}
      </div>
    </div>
  );
}
