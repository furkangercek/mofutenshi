import type { Metadata } from "next";
import { ProductListing } from "@/components/product/product-listing";
import { listingCopy } from "@/lib/copy/catalog";
import { siteCopy } from "@/lib/copy/common";
import { getAllTags } from "@/lib/queries/catalog";

export const metadata: Metadata = {
  title: listingCopy.allProductsTitle,
  description: siteCopy.description,
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [resolvedParams, tags] = await Promise.all([searchParams, getAllTags()]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl sm:text-4xl">{listingCopy.allProductsTitle}</h1>
      <div className="mt-6">
        <ProductListing searchParams={resolvedParams} basePath="/products" tagOptions={tags} />
      </div>
    </div>
  );
}
