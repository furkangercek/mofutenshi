import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { resolveEffectivePrice, type ActiveSale } from "@/lib/pricing";

// Scale assumption (single-brand shop, catalog well under a few thousand
// products): the published catalog is loaded into one cached snapshot and
// filtered/sorted in JS. Revisit with SQL-side filtering if that changes.

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  imageKey: string | null;
  imageAlt: string | null;
  priceCents: number;
  originalCents: number;
  onSale: boolean;
  inStock: boolean;
  isFeatured: boolean;
  createdAtMs: number;
  tagIds: string[];
  tagSlugs: string[];
  searchText: string;
};

export type ProductDetailData = {
  id: string;
  slug: string;
  name: string;
  description: string;
  images: { key: string; alt: string; isPrimary: boolean; variantId: string | null }[];
  optionTypes: { id: string; name: string; values: { id: string; value: string }[] }[];
  variants: {
    id: string;
    priceCents: number;
    effectiveCents: number;
    onSale: boolean;
    stock: number;
    optionValueIds: string[];
  }[];
};

export async function loadActiveSales(now: Date): Promise<ActiveSale[]> {
  const sales = await prisma.sale.findMany({
    where: { endedEarly: false, startsAt: { lte: now }, endsAt: { gte: now } },
    select: {
      id: true,
      type: true,
      value: true,
      products: { select: { productId: true } },
      tags: { select: { tagId: true } },
    },
  });
  if (sales.length === 0) return [];

  const scopedTagIds = sales.flatMap((sale) => sale.tags.map((t) => t.tagId));
  const childTags = scopedTagIds.length
    ? await prisma.tag.findMany({
        where: { parentId: { in: scopedTagIds } },
        select: { id: true, parentId: true },
      })
    : [];
  const childrenByParent = new Map<string, string[]>();
  for (const child of childTags) {
    if (!child.parentId) continue;
    const list = childrenByParent.get(child.parentId) ?? [];
    list.push(child.id);
    childrenByParent.set(child.parentId, list);
  }

  return sales.map((sale) => ({
    id: sale.id,
    type: sale.type,
    value: sale.value,
    productIds: new Set(sale.products.map((p) => p.productId)),
    tagIds: new Set(sale.tags.flatMap((t) => [t.tagId, ...(childrenByParent.get(t.tagId) ?? [])])),
  }));
}

export async function getCatalog(): Promise<ProductCardData[]> {
  "use cache";
  cacheTag("catalog");
  // Sale windows are time-based; 5 min bounds how stale a flip can be.
  cacheLife({ revalidate: 300, expire: 3600 });

  const now = new Date();
  const [products, activeSales] = await Promise.all([
    prisma.product.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        isFeatured: true,
        createdAt: true,
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 },
        tags: { select: { tag: { select: { id: true, slug: true } } } },
        variants: {
          where: { isActive: true },
          select: { priceCents: true, stock: true },
        },
      },
    }),
    loadActiveSales(now),
  ]);

  return products
    .filter((product) => product.variants.length > 0)
    .map((product) => {
      const tagIds = product.tags.map((t) => t.tag.id);
      const prices = product.variants.map((variant) =>
        resolveEffectivePrice(variant.priceCents, { id: product.id, tagIds }, activeSales),
      );
      const best = prices.reduce((min, p) => (p.effectiveCents < min.effectiveCents ? p : min));
      const image = product.images[0];

      return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        imageKey: image?.key ?? null,
        imageAlt: image?.alt ?? null,
        priceCents: best.effectiveCents,
        originalCents: best.originalCents,
        onSale: best.onSale,
        inStock: product.variants.some((variant) => variant.stock > 0),
        isFeatured: product.isFeatured,
        createdAtMs: product.createdAt.getTime(),
        tagIds,
        tagSlugs: product.tags.map((t) => t.tag.slug),
        searchText: `${product.name} ${product.description}`.toLocaleLowerCase("tr-TR"),
      };
    });
}

export async function getProductDetail(slug: string): Promise<ProductDetailData | null> {
  "use cache";
  cacheTag("catalog");
  cacheLife({ revalidate: 300, expire: 3600 });

  const now = new Date();
  const product = await prisma.product.findUnique({
    where: { slug, status: "PUBLISHED" },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      images: {
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        select: { key: true, alt: true, isPrimary: true, variantId: true },
      },
      optionTypes: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          values: { orderBy: { sortOrder: "asc" }, select: { id: true, value: true } },
        },
      },
      tags: { select: { tagId: true } },
      variants: {
        where: { isActive: true },
        select: {
          id: true,
          priceCents: true,
          stock: true,
          optionValues: { select: { optionValueId: true } },
        },
      },
    },
  });
  if (!product || product.variants.length === 0) return null;

  const activeSales = await loadActiveSales(now);
  const tagIds = product.tags.map((t) => t.tagId);

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    images: product.images,
    optionTypes: product.optionTypes,
    variants: product.variants.map((variant) => {
      const price = resolveEffectivePrice(
        variant.priceCents,
        { id: product.id, tagIds },
        activeSales,
      );
      return {
        id: variant.id,
        priceCents: variant.priceCents,
        effectiveCents: price.effectiveCents,
        onSale: price.onSale,
        stock: variant.stock,
        optionValueIds: variant.optionValues.map((v) => v.optionValueId),
      };
    }),
  };
}

export type TagOption = { name: string; slug: string };

export async function getAllTags(): Promise<TagOption[]> {
  "use cache";
  cacheTag("tags");
  cacheLife("hours");

  return prisma.tag.findMany({
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
    select: { name: true, slug: true },
  });
}

export type TagPageData = {
  id: string;
  name: string;
  slug: string;
  tagIds: string[];
  children: { name: string; slug: string }[];
};

export async function getTagPageData(slug: string): Promise<TagPageData | null> {
  "use cache";
  cacheTag("tags");
  cacheLife("hours");

  const tag = await prisma.tag.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      children: { orderBy: { sortOrder: "asc" }, select: { id: true, name: true, slug: true } },
    },
  });
  if (!tag) return null;

  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    tagIds: [tag.id, ...tag.children.map((child) => child.id)],
    children: tag.children.map((child) => ({ name: child.name, slug: child.slug })),
  };
}
