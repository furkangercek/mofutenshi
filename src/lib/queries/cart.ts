import { cache } from "react";
import { getCartIdentity } from "@/lib/cart-identity";
import { resolveEffectivePrice } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { loadActiveSales } from "@/lib/queries/catalog";
import { variantLabel } from "@/lib/variant-label";

// Per-user data: never "use cache". React cache() dedupes the header badge
// and drawer reads within a single request render.

export type CartLineView = {
  itemId: string;
  variantId: string;
  productName: string;
  productSlug: string;
  variantLabel: string | null;
  imageKey: string | null;
  imageAlt: string | null;
  quantity: number;
  stock: number;
  unitCents: number;
  unitOriginalCents: number;
  onSale: boolean;
  lineCents: number;
};

export type CartView = {
  lines: CartLineView[];
  itemCount: number;
  subtotalCents: number;
};

const emptyCart: CartView = { lines: [], itemCount: 0, subtotalCents: 0 };

export const getCartView = cache(async (): Promise<CartView> => {
  const identity = await getCartIdentity();
  if (!identity) return emptyCart;

  const cart = await prisma.cart.findUnique({
    where: identity,
    select: {
      items: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          quantity: true,
          variant: {
            select: {
              id: true,
              priceCents: true,
              stock: true,
              isActive: true,
              optionValues: {
                select: {
                  optionValue: {
                    select: { value: true, optionType: { select: { sortOrder: true } } },
                  },
                },
              },
              product: {
                select: {
                  id: true,
                  slug: true,
                  name: true,
                  status: true,
                  tags: { select: { tagId: true } },
                  images: {
                    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
                    select: { key: true, alt: true, variantId: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!cart) return emptyCart;

  const activeSales = await loadActiveSales(new Date());

  // Lines whose variant was deactivated or product unpublished are hidden
  // rather than priced; checkout (step 7) re-validates the whole cart anyway.
  const lines = cart.items
    .filter((item) => item.variant.isActive && item.variant.product.status === "PUBLISHED")
    .map((item) => {
      const { variant } = item;
      const price = resolveEffectivePrice(
        variant.priceCents,
        { id: variant.product.id, tagIds: variant.product.tags.map((t) => t.tagId) },
        activeSales,
      );
      const image =
        variant.product.images.find((img) => img.variantId === variant.id) ??
        variant.product.images[0];

      return {
        itemId: item.id,
        variantId: variant.id,
        productName: variant.product.name,
        productSlug: variant.product.slug,
        variantLabel: variantLabel(variant.optionValues),
        imageKey: image?.key ?? null,
        imageAlt: image?.alt ?? null,
        quantity: item.quantity,
        stock: variant.stock,
        unitCents: price.effectiveCents,
        unitOriginalCents: price.originalCents,
        onSale: price.onSale,
        lineCents: price.effectiveCents * item.quantity,
      };
    });

  return {
    lines,
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotalCents: lines.reduce((sum, line) => sum + line.lineCents, 0),
  };
});
