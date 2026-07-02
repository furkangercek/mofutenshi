"use client";

import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { loadMoreCards } from "@/lib/actions/catalog";
import { ProductCard, type ProductCardView } from "@/components/product/product-card";
import { listingCopy } from "@/lib/copy/catalog";

// Infinite scroll with a crawlable fallback: the SSR HTML contains a real
// next-page <a>; once JS mounts, an IntersectionObserver takes over and the
// link is replaced by the auto-loader (PRD §5.2 US-03).
export function ProductGrid({
  initialCards,
  initialHasMore,
  rawParams,
  scopeTagSlug,
  nextPageHref,
}: {
  initialCards: ProductCardView[];
  initialHasMore: boolean;
  rawParams: Record<string, string>;
  scopeTagSlug?: string;
  nextPageHref: string | null;
}) {
  const [cards, setCards] = useState(initialCards);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);
  // True only after hydration — swaps the crawlable next-page link for the
  // IntersectionObserver auto-loader.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || isPending) return;

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      startTransition(async () => {
        const nextPage = page + 1;
        const result = await loadMoreCards({
          rawParams: { ...rawParams, page: String(nextPage) },
          scopeTagSlug,
        });
        setCards((current) => [...current, ...result.cards]);
        setHasMore(result.hasMore);
        setPage(nextPage);
      });
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isPending, page, rawParams, scopeTagSlug]);

  return (
    <>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((card) => (
          <ProductCard key={card.id} product={card} />
        ))}
      </div>
      {hasMore && (
        <div ref={sentinelRef} className="mt-10 flex justify-center">
          {mounted ? (
            <p aria-live="polite" className="text-muted text-sm">
              {isPending ? listingCopy.loading : listingCopy.loadMore}
            </p>
          ) : (
            nextPageHref && (
              <a
                href={nextPageHref}
                className="border-border bg-surface hover:bg-background inline-flex h-11 items-center rounded-md border px-6 font-medium transition-colors"
              >
                {listingCopy.nextPage}
              </a>
            )
          )}
        </div>
      )}
    </>
  );
}
