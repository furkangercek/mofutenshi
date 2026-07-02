import type { ProductCardView } from "@/components/product/product-card";
import type { ProductCardData } from "@/lib/queries/catalog";

// Trims the cached catalog row to what the card (and the load-more wire
// payload) actually needs.
export function toCardView(card: ProductCardData): ProductCardView {
  return {
    id: card.id,
    slug: card.slug,
    name: card.name,
    imageKey: card.imageKey,
    imageAlt: card.imageAlt,
    priceCents: card.priceCents,
    originalCents: card.originalCents,
    onSale: card.onSale,
    inStock: card.inStock,
  };
}
