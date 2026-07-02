import type { Metadata } from "next";
import { ProductListing } from "@/components/product/product-listing";
import { listingCopy } from "@/lib/copy/catalog";

export const metadata: Metadata = {
  title: listingCopy.salesTitle,
  description: listingCopy.salesDescription,
};

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await searchParams;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl sm:text-4xl">{listingCopy.salesTitle}</h1>
      <p className="text-muted mt-2 max-w-xl">{listingCopy.salesDescription}</p>
      <div className="mt-6">
        <ProductListing
          searchParams={{ ...resolvedParams, sale: "1" }}
          basePath="/sales"
          showSaleFilter={false}
        />
      </div>
    </div>
  );
}
