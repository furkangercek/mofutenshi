import type { Metadata } from "next";
import { ProductCard } from "@/components/product/product-card";
import { ButtonLink } from "@/components/ui/button";
import { selectBestSellers } from "@/lib/best-sellers";
import { toCardView } from "@/lib/card-view";
import { listingCopy } from "@/lib/copy/catalog";
import { getBestSellerRanking, getCatalog } from "@/lib/queries/catalog";

export const metadata: Metadata = {
  title: listingCopy.bestSellersTitle,
  description: listingCopy.bestSellersDescription,
  alternates: { canonical: "/best-sellers" },
};

// Derived view like /sales (DATA_MODEL invariant 8): rank order comes from
// real order data, so the filter/sort listing machinery does not apply here.
export default async function BestSellersPage() {
  const [catalog, ranking] = await Promise.all([getCatalog(), getBestSellerRanking()]);
  const products = selectBestSellers(catalog, ranking);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl sm:text-4xl">{listingCopy.bestSellersTitle}</h1>
      <p className="text-muted mt-2 max-w-xl">{listingCopy.bestSellersDescription}</p>
      <div className="mt-6">
        {products.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <p className="text-muted">{listingCopy.bestSellersEmpty}</p>
            <ButtonLink href="/products">{listingCopy.bestSellersEmptyCta}</ButtonLink>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={toCardView(product)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
