import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard, type ProductCardView } from "@/components/product/product-card";
import { homeSectionCopy } from "@/lib/copy/catalog";

export function ProductRow({
  title,
  href,
  products,
}: {
  title: string;
  href: string;
  products: ProductCardView[];
}) {
  if (products.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-display text-2xl sm:text-3xl">{title}</h2>
        <Link
          href={href}
          className="text-muted hover:text-ink flex items-center gap-1 text-sm font-medium transition-colors"
        >
          {homeSectionCopy.viewAll}
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
