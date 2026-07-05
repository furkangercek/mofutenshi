import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductListing } from "@/components/product/product-listing";
import { ListingContentSkeleton } from "@/components/product/skeletons";
import { listingCopy } from "@/lib/copy/catalog";
import { getSitemapData, getTagPageData } from "@/lib/queries/catalog";

type Props = { params: Promise<{ tagSlug: string }> };

// Prerender every tag page (small catalog); unknown slugs still stream. The
// placeholder keeps empty-database builds green (see /p/[productSlug]).
export async function generateStaticParams() {
  const { tags } = await getSitemapData();
  if (tags.length === 0) return [{ tagSlug: "__placeholder__" }];
  return tags.map((tag) => ({ tagSlug: tag.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tagSlug } = await params;
  const tag = await getTagPageData(tagSlug);
  if (!tag) return {};
  return {
    title: tag.name,
    description: listingCopy.tagDescription(tag.name),
    alternates: { canonical: `/t/${tag.slug}` },
  };
}

export default async function TagPage({
  params,
  searchParams,
}: Props & { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { tagSlug } = await params;
  const tag = await getTagPageData(tagSlug);
  if (!tag) notFound();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl sm:text-4xl">{tag.name}</h1>
      {tag.children.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tag.children.map((child) => (
            <Link
              key={child.slug}
              href={`/t/${child.slug}`}
              className="border-border bg-surface hover:bg-background inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium transition-colors"
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}
      <div className="mt-6">
        <Suspense fallback={<ListingContentSkeleton />}>
          <ProductListing
            searchParams={searchParams}
            basePath={`/t/${tag.slug}`}
            scopeTagIds={tag.tagIds}
            scopeTagSlug={tag.slug}
          />
        </Suspense>
      </div>
    </div>
  );
}
