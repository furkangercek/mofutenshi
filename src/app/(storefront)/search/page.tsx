import type { Metadata } from "next";
import Form from "next/form";
import { Search } from "lucide-react";
import { ProductListing } from "@/components/product/product-listing";
import { listingCopy, searchCopy } from "@/lib/copy/catalog";

export const metadata: Metadata = {
  title: listingCopy.searchEmptyQuery,
  robots: { index: false },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await searchParams;
  const q = typeof resolvedParams.q === "string" ? resolvedParams.q.trim() : "";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl sm:text-4xl">
        {q ? listingCopy.searchTitle(q) : listingCopy.searchEmptyQuery}
      </h1>
      <Form action="/search" className="mt-6 flex max-w-md gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder={searchCopy.placeholder}
          aria-label={searchCopy.placeholder}
          className="border-border bg-surface focus:outline-ring h-11 flex-1 rounded-md border px-3 text-sm focus:outline-2"
        />
        <button
          type="submit"
          aria-label={searchCopy.submit}
          className="bg-primary text-primary-contrast hover:bg-primary-hover inline-flex size-11 items-center justify-center rounded-md transition"
        >
          <Search aria-hidden className="size-4" />
        </button>
      </Form>
      <div className="mt-6">
        <ProductListing searchParams={resolvedParams} basePath="/search" />
      </div>
    </div>
  );
}
