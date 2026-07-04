import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, ButtonSecondary } from "@/components/ui/button";
import { inputClass } from "@/components/ui/form";
import { requireAdmin } from "@/lib/admin-guard";
import { adminProductsCopy } from "@/lib/copy/admin";
import { formatKurus } from "@/lib/money";
import { getAdminProducts } from "@/lib/queries/admin";

export const metadata: Metadata = { title: adminProductsCopy.title };

function priceRange(min: number | null, max: number | null): string {
  if (min === null || max === null) return "—";
  return min === max ? formatKurus(min) : `${formatKurus(min)} – ${formatKurus(max)}`;
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireAdmin("/admin/products");
  const { q, status } = await searchParams;

  const all = await getAdminProducts();
  const query = (q ?? "").trim().toLocaleLowerCase("tr-TR");
  const products = all.filter((product) => {
    if (status === "PUBLISHED" || status === "DRAFT") {
      if (product.status !== status) return false;
    }
    return !query || product.name.toLocaleLowerCase("tr-TR").includes(query);
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl">{adminProductsCopy.title}</h1>
        <ButtonLink href="/admin/products/new">{adminProductsCopy.newCta}</ButtonLink>
      </div>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <label className="block grow text-sm font-medium sm:max-w-xs">
          <span className="sr-only">{adminProductsCopy.searchLabel}</span>
          <input
            name="q"
            type="search"
            defaultValue={q ?? ""}
            placeholder={adminProductsCopy.searchPlaceholder}
            className={`${inputClass} mt-0`}
          />
        </label>
        <label className="block text-sm font-medium">
          <span className="sr-only">{adminProductsCopy.statusLabel}</span>
          <select name="status" defaultValue={status ?? ""} className={`${inputClass} mt-0 w-40`}>
            <option value="">{adminProductsCopy.filterAll}</option>
            <option value="PUBLISHED">{adminProductsCopy.filterPublished}</option>
            <option value="DRAFT">{adminProductsCopy.filterDraft}</option>
          </select>
        </label>
        <ButtonSecondary type="submit" className="text-sm">
          {adminProductsCopy.searchLabel}
        </ButtonSecondary>
      </form>

      {products.length === 0 ? (
        <p className="text-muted mt-6">{adminProductsCopy.empty}</p>
      ) : (
        <ul className="border-border bg-surface divide-border mt-6 divide-y rounded-lg border">
          {products.map((product) => (
            <li key={product.id}>
              <Link
                href={`/admin/products/${product.id}`}
                className="hover:bg-ghost flex items-baseline justify-between gap-3 rounded-md px-4 py-3 transition"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{product.name}</span>
                  <span className="text-muted block text-sm">
                    {adminProductsCopy.statusLabels[product.status]} ·{" "}
                    {adminProductsCopy.variantCount(product.variantCount)} ·{" "}
                    {adminProductsCopy.stockTotal(product.stockTotal)}
                  </span>
                </span>
                <span className="text-sm font-semibold whitespace-nowrap">
                  {priceRange(product.minPriceCents, product.maxPriceCents)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
