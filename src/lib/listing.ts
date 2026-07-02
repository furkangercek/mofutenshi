import { z } from "zod";
import type { ProductCardData } from "@/lib/queries/catalog";

export const PAGE_SIZE = 24;

export const sortValues = ["newest", "price-asc", "price-desc", "sale-first"] as const;
export type SortValue = (typeof sortValues)[number];

const positiveInt = z.coerce.number().int().positive();

// Query-param boundary: everything arriving from the URL or the load-more
// action passes through here (CLAUDE.md: zod at boundaries).
export const listingParamsSchema = z.object({
  q: z.string().trim().max(100).optional(),
  tag: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  // Prices in the URL are whole lira for readability; converted to kuruş here.
  min: positiveInt.transform((lira) => lira * 100).optional(),
  max: positiveInt.transform((lira) => lira * 100).optional(),
  sale: z.literal("1").optional(),
  stock: z.literal("1").optional(),
  sort: z.enum(sortValues).catch("newest").default("newest"),
  page: positiveInt.catch(1).default(1),
});

export type ListingParams = z.infer<typeof listingParamsSchema>;

export function parseListingParams(searchParams: Record<string, string | string[] | undefined>) {
  const flat = Object.fromEntries(
    Object.entries(searchParams).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );
  const result = listingParamsSchema.safeParse(flat);
  return result.success ? result.data : listingParamsSchema.parse({});
}

export function applyListing(
  cards: ProductCardData[],
  params: ListingParams,
  scopeTagIds?: string[],
) {
  let result = cards;

  if (scopeTagIds && scopeTagIds.length > 0) {
    const scope = new Set(scopeTagIds);
    result = result.filter((card) => card.tagIds.some((id) => scope.has(id)));
  }
  if (params.tag) {
    result = result.filter((card) => card.tagSlugs.includes(params.tag!));
  }
  if (params.q) {
    const query = params.q.toLocaleLowerCase("tr-TR");
    result = result.filter((card) => card.searchText.includes(query));
  }
  if (params.min !== undefined) {
    result = result.filter((card) => card.priceCents >= params.min!);
  }
  if (params.max !== undefined) {
    result = result.filter((card) => card.priceCents <= params.max!);
  }
  if (params.sale) {
    result = result.filter((card) => card.onSale);
  }
  if (params.stock) {
    result = result.filter((card) => card.inStock);
  }

  result = [...result];
  switch (params.sort) {
    case "newest":
      result.sort((a, b) => b.createdAtMs - a.createdAtMs);
      break;
    case "price-asc":
      result.sort((a, b) => a.priceCents - b.priceCents);
      break;
    case "price-desc":
      result.sort((a, b) => b.priceCents - a.priceCents);
      break;
    case "sale-first":
      result.sort((a, b) => Number(b.onSale) - Number(a.onSale) || b.createdAtMs - a.createdAtMs);
      break;
  }

  const totalCount = result.length;
  const end = params.page * PAGE_SIZE;
  return {
    cards: result.slice(end - PAGE_SIZE, end),
    totalCount,
    hasMore: end < totalCount,
  };
}
