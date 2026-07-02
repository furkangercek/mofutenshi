import Link from "next/link";
import { FilterBar } from "@/components/product/filter-bar";
import { ProductGrid } from "@/components/product/product-grid";
import { toCardView } from "@/lib/card-view";
import { listingCopy } from "@/lib/copy/catalog";
import { applyListing, parseListingParams } from "@/lib/listing";
import { getCatalog } from "@/lib/queries/catalog";

const knownParamKeys = ["q", "tag", "min", "max", "sale", "stock", "sort"] as const;

export async function ProductListing({
  searchParams,
  basePath,
  scopeTagIds,
  scopeTagSlug,
  showSaleFilter = true,
  tagOptions,
}: {
  searchParams: Record<string, string | string[] | undefined>;
  basePath: string;
  scopeTagIds?: string[];
  scopeTagSlug?: string;
  showSaleFilter?: boolean;
  tagOptions?: { slug: string; name: string }[];
}) {
  const params = parseListingParams(searchParams);
  const catalog = await getCatalog();
  const { cards, totalCount, hasMore } = applyListing(catalog, params, scopeTagIds);

  const rawParams: Record<string, string> = {};
  for (const key of knownParamKeys) {
    const value = searchParams[key];
    if (typeof value === "string" && value !== "") rawParams[key] = value;
  }
  const nextQuery = new URLSearchParams({ ...rawParams, page: String(params.page + 1) });
  const nextPageHref = hasMore ? `${basePath}?${nextQuery.toString()}` : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <FilterBar showSaleFilter={showSaleFilter} tagOptions={tagOptions} />
        <p className="text-muted text-sm">{listingCopy.resultCount(totalCount)}</p>
      </div>
      {totalCount === 0 ? (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <p className="text-muted">{listingCopy.empty}</p>
          <Link
            href={basePath}
            className="border-border bg-surface hover:bg-background inline-flex h-11 items-center rounded-md border px-6 font-medium transition-colors"
          >
            {listingCopy.emptyReset}
          </Link>
        </div>
      ) : (
        <ProductGrid
          key={JSON.stringify(rawParams)}
          initialCards={cards.map(toCardView)}
          initialHasMore={hasMore}
          rawParams={rawParams}
          scopeTagSlug={scopeTagSlug}
          nextPageHref={nextPageHref}
        />
      )}
    </div>
  );
}
