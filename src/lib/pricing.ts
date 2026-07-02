// Effective-price resolution per PRD §7: computed at read time, never
// stored. Overlap rule: best price for the customer wins, no stacking.

export type ActiveSale = {
  id: string;
  type: "PERCENT" | "FIXED";
  value: number;
  productIds: ReadonlySet<string>;
  // Scoped tag ids expanded to include child tags (a sale on `figures`
  // applies to products tagged `anime`, `scale`, ... — PRD §3.1 semantics).
  tagIds: ReadonlySet<string>;
};

export type EffectivePrice = {
  originalCents: number;
  effectiveCents: number;
  onSale: boolean;
  saleId?: string;
};

function discountedPrice(priceCents: number, sale: ActiveSale): number {
  if (sale.type === "PERCENT") {
    return Math.floor((priceCents * (100 - sale.value)) / 100);
  }
  return Math.max(0, priceCents - sale.value);
}

export function resolveEffectivePrice(
  priceCents: number,
  product: { id: string; tagIds: readonly string[] },
  activeSales: readonly ActiveSale[],
): EffectivePrice {
  let effectiveCents = priceCents;
  let saleId: string | undefined;

  for (const sale of activeSales) {
    const applies =
      sale.productIds.has(product.id) || product.tagIds.some((tagId) => sale.tagIds.has(tagId));
    if (!applies) continue;

    const discounted = discountedPrice(priceCents, sale);
    if (discounted < effectiveCents) {
      effectiveCents = discounted;
      saleId = sale.id;
    }
  }

  return {
    originalCents: priceCents,
    effectiveCents,
    onSale: effectiveCents < priceCents,
    saleId,
  };
}
