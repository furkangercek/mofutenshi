"use client";

import { useMemo, useState } from "react";
import { Price } from "@/components/product/price";
import { ProductImage } from "@/components/product/product-image";
import { productCopy } from "@/lib/copy/catalog";
import type { ProductDetailData } from "@/lib/queries/catalog";

type Variant = ProductDetailData["variants"][number];

// Default selection: lowest-priced in-stock variant, else first (PRD US-05).
function defaultVariant(variants: Variant[]): Variant {
  const inStock = variants.filter((variant) => variant.stock > 0);
  const pool = inStock.length > 0 ? inStock : variants;
  return pool.reduce((min, v) => (v.effectiveCents < min.effectiveCents ? v : min));
}

export function ProductView({ product }: { product: ProductDetailData }) {
  const initial = useMemo(() => defaultVariant(product.variants), [product.variants]);
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const type of product.optionTypes) {
      const valueId = type.values.find((v) => initial.optionValueIds.includes(v.id))?.id;
      if (valueId) map[type.id] = valueId;
    }
    return map;
  });
  const [imageIndex, setImageIndex] = useState<number | null>(null);

  const selectedVariant = useMemo(() => {
    const chosen = Object.values(selected);
    if (product.optionTypes.length === 0) return product.variants[0];
    if (chosen.length < product.optionTypes.length) return undefined;
    return product.variants.find((variant) =>
      chosen.every((valueId) => variant.optionValueIds.includes(valueId)),
    );
  }, [product, selected]);

  const variantImageIndex = selectedVariant
    ? product.images.findIndex((image) => image.variantId === selectedVariant.id)
    : -1;
  const activeIndex = imageIndex ?? (variantImageIndex >= 0 ? variantImageIndex : 0);
  const activeImage = product.images[activeIndex] ?? null;

  const outOfStock = selectedVariant !== undefined && selectedVariant.stock === 0;

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div>
        <div className="border-border bg-surface relative aspect-4/5 overflow-hidden rounded-xl border">
          <ProductImage
            imageKey={activeImage?.key ?? null}
            alt={activeImage?.alt ?? product.name}
            sizes="(min-width: 1024px) 50vw, 100vw"
            priority
          />
        </div>
        {product.images.length > 1 && (
          <div className="mt-3 flex gap-2">
            {product.images.map((image, index) => (
              <button
                key={image.key}
                type="button"
                onClick={() => setImageIndex(index)}
                aria-label={image.alt || productCopy.galleryImageLabel(index)}
                aria-current={index === activeIndex}
                className={`border-border relative size-16 overflow-hidden rounded-md border transition-opacity ${
                  index === activeIndex ? "" : "opacity-60 hover:opacity-100"
                }`}
              >
                <ProductImage imageKey={image.key} alt="" sizes="64px" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6">
        <h1 className="font-display text-3xl sm:text-4xl">{product.name}</h1>

        {selectedVariant ? (
          <div className="flex items-center gap-3">
            <Price
              priceCents={selectedVariant.effectiveCents}
              originalCents={selectedVariant.priceCents}
              onSale={selectedVariant.onSale}
              className="text-2xl"
            />
            <span className={`text-sm font-medium ${outOfStock ? "text-muted" : ""}`}>
              {outOfStock ? productCopy.outOfStock : productCopy.inStock}
            </span>
          </div>
        ) : (
          <p className="text-muted font-medium">{productCopy.comboUnavailable}</p>
        )}

        {product.optionTypes.map((type) => (
          <fieldset key={type.id}>
            <legend className="text-sm font-semibold">{type.name}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {type.values.map((value) => {
                const active = selected[type.id] === value.id;
                return (
                  <button
                    key={value.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelected((s) => ({ ...s, [type.id]: value.id }))}
                    className={`h-11 rounded-md border px-4 text-sm font-medium transition-colors ${
                      active
                        ? "border-ring bg-primary text-primary-contrast"
                        : "border-border bg-surface hover:bg-background"
                    }`}
                  >
                    {value.value}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}

        <div>
          {/* Wired up in Phase 1 step 5 (cart); disabled until then. */}
          <button
            type="button"
            disabled
            className="bg-primary text-primary-contrast inline-flex h-12 items-center rounded-md px-8 font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {productCopy.addToCart}
          </button>
          <p className="text-muted mt-2 text-sm">{productCopy.cartComingSoon}</p>
        </div>

        <p className="text-muted leading-relaxed whitespace-pre-line">{product.description}</p>
      </div>
    </div>
  );
}
