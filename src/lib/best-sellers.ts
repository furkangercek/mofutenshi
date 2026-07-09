import type { ProductCardData } from "@/lib/queries/catalog";

const BEST_SELLER_TAG_SLUG = "best-seller";

// R20: order-data ranking first; the manual `best-seller` tag only fills the
// tail so the section is not empty before real sales exist (cold start).
export function selectBestSellers(
  catalog: ProductCardData[],
  rankedProductIds: string[],
  limit?: number,
): ProductCardData[] {
  const byId = new Map(catalog.map((product) => [product.id, product]));
  const ranked = rankedProductIds.flatMap((id) => byId.get(id) ?? []);
  const rankedIds = new Set(ranked.map((product) => product.id));
  const fillers = catalog.filter(
    (product) => product.tagSlugs.includes(BEST_SELLER_TAG_SLUG) && !rankedIds.has(product.id),
  );
  const merged = [...ranked, ...fillers];
  return limit === undefined ? merged : merged.slice(0, limit);
}
