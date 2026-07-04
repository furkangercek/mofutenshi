"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ButtonSecondary } from "@/components/ui/button";
import { inputClass } from "@/components/ui/form";
import type { AdminFormState } from "@/lib/actions/admin-settings";
import { updateStockAction } from "@/lib/actions/admin-inventory";
import { adminInventoryCopy } from "@/lib/copy/admin";
import { formatKurus } from "@/lib/money";
import type { AdminInventoryRow } from "@/lib/queries/admin";

const initialState: AdminFormState = { error: null, saved: false };

function StockCellForm({ row }: { row: AdminInventoryRow }) {
  const [state, formAction, isPending] = useActionState(updateStockAction, initialState);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="variantId" value={row.variantId} />
      <input
        name="stock"
        type="number"
        min={0}
        max={1000000}
        defaultValue={row.stock}
        aria-label={adminInventoryCopy.stockInputLabel(
          row.variantLabel ? `${row.productName} (${row.variantLabel})` : row.productName,
        )}
        className={`${inputClass} mt-0 w-24`}
      />
      <ButtonSecondary type="submit" disabled={isPending} className="text-sm">
        {adminInventoryCopy.save}
      </ButtonSecondary>
      {state.error && (
        <span role="alert" className="text-muted text-xs">
          {state.error}
        </span>
      )}
    </form>
  );
}

export function InventoryTable({
  rows,
  lowStockThreshold,
}: {
  rows: AdminInventoryRow[];
  lowStockThreshold: number;
}) {
  return (
    <div className="border-border overflow-x-auto rounded-lg border">
      <table className="bg-surface w-full min-w-[42rem] text-sm">
        <thead>
          <tr className="border-border text-muted border-b text-left">
            <th className="px-3 py-2 font-medium">{adminInventoryCopy.productHeader}</th>
            <th className="px-3 py-2 font-medium">{adminInventoryCopy.skuHeader}</th>
            <th className="px-3 py-2 font-medium">{adminInventoryCopy.priceHeader}</th>
            <th className="px-3 py-2 font-medium">{adminInventoryCopy.stockHeader}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const low = row.stock < lowStockThreshold;
            return (
              <tr key={row.variantId} className="border-border border-b last:border-0">
                <th scope="row" className="px-3 py-2 text-left font-medium">
                  <Link
                    href={`/admin/products/${row.productId}`}
                    className="hover:text-muted underline-offset-4 hover:underline"
                  >
                    {row.productName}
                    {row.variantLabel ? (
                      <span className="text-muted font-normal"> · {row.variantLabel}</span>
                    ) : null}
                  </Link>
                  <span className="mt-0.5 flex flex-wrap gap-1">
                    {low ? (
                      <span className="bg-accent text-ink rounded-full px-2 py-0.5 text-xs font-medium">
                        {adminInventoryCopy.lowBadge}
                      </span>
                    ) : null}
                    {!row.isActive ? (
                      <span className="bg-ghost text-muted rounded-full px-2 py-0.5 text-xs font-medium">
                        {adminInventoryCopy.inactiveBadge}
                      </span>
                    ) : null}
                    {row.productStatus === "DRAFT" ? (
                      <span className="bg-ghost text-muted rounded-full px-2 py-0.5 text-xs font-medium">
                        {adminInventoryCopy.draftBadge}
                      </span>
                    ) : null}
                  </span>
                </th>
                <td className="text-muted px-3 py-2">{row.sku ?? "—"}</td>
                <td className="px-3 py-2 whitespace-nowrap">{formatKurus(row.priceCents)}</td>
                <td className="px-3 py-2">
                  <StockCellForm row={row} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
