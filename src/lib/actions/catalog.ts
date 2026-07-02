"use server";

import { z } from "zod";
import { applyListing, listingParamsSchema } from "@/lib/listing";
import { toCardView } from "@/lib/card-view";
import { getCatalog, getTagPageData } from "@/lib/queries/catalog";
import type { ProductCardView } from "@/components/product/product-card";

const inputSchema = z.object({
  rawParams: z.record(z.string(), z.string()),
  scopeTagSlug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .optional(),
});

export async function loadMoreCards(
  input: unknown,
): Promise<{ cards: ProductCardView[]; hasMore: boolean }> {
  const { rawParams, scopeTagSlug } = inputSchema.parse(input);
  const params = listingParamsSchema.parse(rawParams);

  let scopeTagIds: string[] | undefined;
  if (scopeTagSlug) {
    const tag = await getTagPageData(scopeTagSlug);
    if (!tag) return { cards: [], hasMore: false };
    scopeTagIds = tag.tagIds;
  }

  const catalog = await getCatalog();
  const { cards, hasMore } = applyListing(catalog, params, scopeTagIds);
  return { cards: cards.map(toCardView), hasMore };
}
