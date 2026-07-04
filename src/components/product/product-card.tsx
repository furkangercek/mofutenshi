import Link from "next/link";
import { ProductImage } from "@/components/product/product-image";
import { Price, SaleBadge } from "@/components/product/price";
import { productCopy } from "@/lib/copy/catalog";

export type ProductCardView = {
  id: string;
  slug: string;
  name: string;
  imageSrc: string | null;
  imageAlt: string | null;
  priceCents: number;
  originalCents: number;
  onSale: boolean;
  inStock: boolean;
};

export function ProductCard({ product }: { product: ProductCardView }) {
  return (
    <Link href={`/p/${product.slug}`} className="group block">
      <div className="border-border bg-surface relative aspect-4/5 overflow-hidden rounded-xl border">
        <ProductImage
          src={product.imageSrc}
          alt={product.imageAlt ?? product.name}
          sizes="(min-width: 1024px) 25vw, 50vw"
          className="transition-transform duration-300 ease-out group-hover:scale-105"
        />
        {product.onSale && <SaleBadge className="absolute top-2 left-2" />}
        {!product.inStock && (
          <span className="bg-surface/85 text-muted absolute right-2 bottom-2 rounded-full px-3 py-1 text-xs font-medium">
            {productCopy.outOfStock}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-start justify-between gap-2">
        <h2 className="text-sm font-medium">{product.name}</h2>
        <Price
          priceCents={product.priceCents}
          originalCents={product.originalCents}
          onSale={product.onSale}
          className="text-sm"
        />
      </div>
    </Link>
  );
}
