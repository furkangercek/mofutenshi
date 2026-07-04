import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductView } from "@/components/product/product-view";
import { imageUrl } from "@/lib/image";
import { getProductDetail } from "@/lib/queries/catalog";

type Props = { params: Promise<{ productSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { productSlug } = await params;
  const product = await getProductDetail(productSlug);
  if (!product) return {};

  const description = product.description.slice(0, 160);
  const image = imageUrl(product.images[0]?.key);
  return {
    title: product.name,
    description,
    openGraph: image ? { images: [{ url: image, alt: product.images[0].alt }] } : undefined,
  };
}

// schema.org Product/Offer — price is the EFFECTIVE (sale-aware) price in
// decimal lira (JSON-LD wants decimal units; view-layer conversion only).
function jsonLd(product: NonNullable<Awaited<ReturnType<typeof getProductDetail>>>) {
  const prices = product.variants.map((variant) => variant.effectiveCents);
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  const inStock = product.variants.some((variant) => variant.stock > 0);
  const image = imageUrl(product.images[0]?.key);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    ...(image ? { image } : {}),
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

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(product)) }}
      />
      <ProductView product={product} />
    </div>
  );
}
