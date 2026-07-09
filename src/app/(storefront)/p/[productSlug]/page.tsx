import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FavoriteToggle } from "@/components/product/favorite-toggle";
import { ProductReviews } from "@/components/product/product-reviews";
import { ProductView } from "@/components/product/product-view";
import { siteCopy } from "@/lib/copy/common";
import { getProductDetail, getSitemapData } from "@/lib/queries/catalog";
import { getProductReviews, type ProductReviewData } from "@/lib/queries/reviews";

type Props = { params: Promise<{ productSlug: string }> };

// Prerender every PDP (small catalog); unknown slugs still stream. Cache
// Components rejects an empty result (build error), and the first production
// deploy builds against an empty database — the placeholder param renders the
// notFound path and keeps that build green (official escape hatch).
export async function generateStaticParams() {
  const { products } = await getSitemapData();
  if (products.length === 0) return [{ productSlug: "__placeholder__" }];
  return products.map((product) => ({ productSlug: product.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { productSlug } = await params;
  const product = await getProductDetail(productSlug);
  if (!product) return {};

  const description = product.description.slice(0, 160) || siteCopy.description;
  const image = product.images[0]?.src ?? null;
  return {
    title: product.name,
    description,
    alternates: { canonical: `/p/${product.slug}` },
    openGraph: image ? { images: [{ url: image, alt: product.images[0].alt }] } : undefined,
  };
}

// schema.org Product/Offer — price is the EFFECTIVE (sale-aware) price in
// decimal lira (JSON-LD wants decimal units; view-layer conversion only).
function jsonLd(
  product: NonNullable<Awaited<ReturnType<typeof getProductDetail>>>,
  reviewData: ProductReviewData,
) {
  const prices = product.variants.map((variant) => variant.effectiveCents);
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  const inStock = product.variants.some((variant) => variant.stock > 0);
  const image = product.images[0]?.src ?? null;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    ...(image ? { image } : {}),
    ...(reviewData.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            // schema.org wants machine-format decimals, not tr-TR commas.
            ratingValue: reviewData.average.toFixed(1),
            reviewCount: reviewData.count,
          },
        }
      : {}),
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "TRY",
      lowPrice: (low / 100).toFixed(2),
      highPrice: (high / 100).toFixed(2),
      offerCount: product.variants.length,
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { productSlug } = await params;
  const product = await getProductDetail(productSlug);
  if (!product) notFound();

  const reviewData = await getProductReviews(product.id);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(product, reviewData)) }}
      />
      <ProductView
        product={product}
        favoriteSlot={
          <Suspense fallback={null}>
            <FavoriteToggle productId={product.id} productSlug={product.slug} />
          </Suspense>
        }
      />
      <ProductReviews productId={product.id} productSlug={product.slug} data={reviewData} />
    </div>
  );
}
