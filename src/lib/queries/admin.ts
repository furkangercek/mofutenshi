import { prisma } from "@/lib/prisma";
import { variantLabel } from "@/lib/variant-label";

// Admin reads are always fresh — never "use cache". The owner must see the
// truth, not a revalidating snapshot.

export type AdminDashboard = {
  publishedCount: number;
  draftCount: number;
  activeSalesCount: number;
  lowStockCount: number;
  lowStockThreshold: number;
  pendingOrdersCount: number;
  recentOrders: {
    id: string;
    orderNumber: string;
    status: "PENDING_PAYMENT" | "PAID" | "CANCELLED" | "FULFILLED";
    totalCents: number;
    placedAt: Date;
    email: string;
  }[];
};

export type AdminTagRow = {
  id: string;
  name: string;
  slug: string;
  type: "HIERARCHICAL" | "FLAT";
  parentId: string | null;
  sortOrder: number;
  productCount: number;
  children: AdminTagRow[];
};

export async function getAdminTags(): Promise<{
  hierarchical: AdminTagRow[];
  flat: AdminTagRow[];
}> {
  const tags = await prisma.tag.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      parentId: true,
      sortOrder: true,
      _count: { select: { products: true } },
    },
  });

  const toRow = (tag: (typeof tags)[number]): AdminTagRow => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    type: tag.type,
    parentId: tag.parentId,
    sortOrder: tag.sortOrder,
    productCount: tag._count.products,
    children: tags.filter((t) => t.parentId === tag.id).map(toRow),
  });

  return {
    hierarchical: tags.filter((t) => t.type === "HIERARCHICAL" && !t.parentId).map(toRow),
    flat: tags.filter((t) => t.type === "FLAT").map(toRow),
  };
}

export type AdminTagDetail = {
  id: string;
  name: string;
  slug: string;
  type: "HIERARCHICAL" | "FLAT";
  parentId: string | null;
  sortOrder: number;
  childCount: number;
};

export async function getAdminTag(id: string): Promise<AdminTagDetail | null> {
  const tag = await prisma.tag.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      parentId: true,
      sortOrder: true,
      _count: { select: { children: true } },
    },
  });
  if (!tag) return null;
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    type: tag.type,
    parentId: tag.parentId,
    sortOrder: tag.sortOrder,
    childCount: tag._count.children,
  };
}

// Eligible parents for a hierarchical tag: top-level hierarchical tags
// (the tag tree is two levels deep — parent → subtag, PRD §3).
export async function getParentTagOptions(
  excludeId?: string,
): Promise<{ id: string; name: string }[]> {
  const tags = await prisma.tag.findMany({
    where: {
      type: "HIERARCHICAL",
      parentId: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });
  return tags;
}

export type AdminProductRow = {
  id: string;
  name: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED";
  updatedAt: Date;
  variantCount: number;
  stockTotal: number;
  minPriceCents: number | null;
  maxPriceCents: number | null;
};

export async function getAdminProducts(): Promise<AdminProductRow[]> {
  const products = await prisma.product.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      updatedAt: true,
      variants: { select: { priceCents: true, stock: true, trackStock: true } },
    },
  });

  return products.map((product) => {
    const prices = product.variants.map((v) => v.priceCents);
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      status: product.status,
      updatedAt: product.updatedAt,
      variantCount: product.variants.length,
      // Made-to-order variants (R26) have no stock count to add.
      stockTotal: product.variants.reduce((sum, v) => sum + (v.trackStock ? v.stock : 0), 0),
      minPriceCents: prices.length ? Math.min(...prices) : null,
      maxPriceCents: prices.length ? Math.max(...prices) : null,
    };
  });
}

export type AdminProductDetail = {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: "DRAFT" | "PUBLISHED";
  isFeatured: boolean;
  tagIds: string[];
  optionTypes: {
    id: string;
    name: string;
    values: { id: string; value: string }[];
  }[];
  variants: {
    id: string;
    sku: string | null;
    priceCents: number;
    stock: number;
    trackStock: boolean;
    isActive: boolean;
    optionValueIds: string[];
  }[];
  images: { id: string; key: string; alt: string; sortOrder: number; isPrimary: boolean }[];
};

export async function getAdminProduct(id: string): Promise<AdminProductDetail | null> {
  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      status: true,
      isFeatured: true,
      tags: { select: { tagId: true } },
      optionTypes: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          values: { orderBy: { sortOrder: "asc" }, select: { id: true, value: true } },
        },
      },
      variants: {
        select: {
          id: true,
          sku: true,
          priceCents: true,
          stock: true,
          trackStock: true,
          isActive: true,
          optionValues: { select: { optionValueId: true } },
        },
      },
      images: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, key: true, alt: true, sortOrder: true, isPrimary: true },
      },
    },
  });
  if (!product) return null;

  return {
    ...product,
    tagIds: product.tags.map((t) => t.tagId),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      priceCents: variant.priceCents,
      stock: variant.stock,
      trackStock: variant.trackStock,
      isActive: variant.isActive,
      optionValueIds: variant.optionValues.map((v) => v.optionValueId),
    })),
  };
}

export type TagCheckboxOption = { id: string; label: string; group: string };

// Flattened tag list for the product form checkboxes, grouped by top-level
// parent (subtags render under their parent's group) with flat tags last.
export async function getTagCheckboxOptions(flatGroupLabel: string): Promise<TagCheckboxOption[]> {
  const tags = await prisma.tag.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, type: true, parentId: true },
  });
  const byId = new Map(tags.map((tag) => [tag.id, tag]));

  const hierarchical = tags
    .filter((tag) => tag.type === "HIERARCHICAL")
    .map((tag) => ({
      id: tag.id,
      label: tag.name,
      group: tag.parentId ? (byId.get(tag.parentId)?.name ?? tag.name) : tag.name,
    }));
  const flat = tags
    .filter((tag) => tag.type === "FLAT")
    .map((tag) => ({ id: tag.id, label: tag.name, group: flatGroupLabel }));

  return [...hierarchical, ...flat];
}

export type AdminSaleRow = {
  id: string;
  name: string;
  type: "PERCENT" | "FIXED";
  value: number;
  startsAt: Date;
  endsAt: Date;
  endedEarly: boolean;
  productCount: number;
  tagCount: number;
};

export async function getAdminSales(): Promise<AdminSaleRow[]> {
  const sales = await prisma.sale.findMany({
    orderBy: { startsAt: "desc" },
    select: {
      id: true,
      name: true,
      type: true,
      value: true,
      startsAt: true,
      endsAt: true,
      endedEarly: true,
      _count: { select: { products: true, tags: true } },
    },
  });
  return sales.map((sale) => ({
    id: sale.id,
    name: sale.name,
    type: sale.type,
    value: sale.value,
    startsAt: sale.startsAt,
    endsAt: sale.endsAt,
    endedEarly: sale.endedEarly,
    productCount: sale._count.products,
    tagCount: sale._count.tags,
  }));
}

export type AdminSaleDetail = {
  id: string;
  name: string;
  type: "PERCENT" | "FIXED";
  value: number;
  startsAt: Date;
  endsAt: Date;
  endedEarly: boolean;
  productIds: string[];
  tagIds: string[];
};

export async function getAdminSale(id: string): Promise<AdminSaleDetail | null> {
  const sale = await prisma.sale.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      type: true,
      value: true,
      startsAt: true,
      endsAt: true,
      endedEarly: true,
      products: { select: { productId: true } },
      tags: { select: { tagId: true } },
    },
  });
  if (!sale) return null;
  return {
    ...sale,
    productIds: sale.products.map((p) => p.productId),
    tagIds: sale.tags.map((t) => t.tagId),
  };
}

export async function getProductOptions(): Promise<{ id: string; name: string }[]> {
  return prisma.product.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export type AdminInventoryRow = {
  variantId: string;
  productId: string;
  productName: string;
  productStatus: "DRAFT" | "PUBLISHED";
  variantLabel: string | null;
  sku: string | null;
  priceCents: number;
  stock: number;
  trackStock: boolean;
  isActive: boolean;
};

export async function getAdminInventory(): Promise<{
  rows: AdminInventoryRow[];
  lowStockThreshold: number;
}> {
  const [variants, settings] = await Promise.all([
    prisma.variant.findMany({
      orderBy: [{ product: { name: "asc" } }, { id: "asc" }],
      select: {
        id: true,
        sku: true,
        priceCents: true,
        stock: true,
        trackStock: true,
        isActive: true,
        product: { select: { id: true, name: true, status: true } },
        optionValues: {
          select: {
            optionValue: {
              select: { value: true, optionType: { select: { sortOrder: true } } },
            },
          },
        },
      },
    }),
    prisma.setting.findUnique({ where: { id: 1 }, select: { lowStockThreshold: true } }),
  ]);

  return {
    rows: variants.map((variant) => ({
      variantId: variant.id,
      productId: variant.product.id,
      productName: variant.product.name,
      productStatus: variant.product.status,
      variantLabel: variantLabel(variant.optionValues),
      sku: variant.sku,
      priceCents: variant.priceCents,
      stock: variant.stock,
      trackStock: variant.trackStock,
      isActive: variant.isActive,
    })),
    lowStockThreshold: settings?.lowStockThreshold ?? 3,
  };
}

export type AdminOrderRow = {
  id: string;
  orderNumber: string;
  email: string;
  status: "PENDING_PAYMENT" | "PAID" | "CANCELLED" | "FULFILLED";
  paymentProvider: string | null;
  totalCents: number;
  placedAt: Date;
  itemCount: number;
};

export async function getAdminOrders(
  status?: "PENDING_PAYMENT" | "PAID" | "CANCELLED" | "FULFILLED",
): Promise<AdminOrderRow[]> {
  const orders = await prisma.order.findMany({
    where: status ? { status } : undefined,
    orderBy: { placedAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      email: true,
      status: true,
      paymentProvider: true,
      totalCents: true,
      placedAt: true,
      items: { select: { quantity: true } },
    },
  });
  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    email: order.email,
    status: order.status,
    paymentProvider: order.paymentProvider,
    totalCents: order.totalCents,
    placedAt: order.placedAt,
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
  }));
}

export type AdminOrderDetail = {
  id: string;
  orderNumber: string;
  email: string;
  status: "PENDING_PAYMENT" | "PAID" | "CANCELLED" | "FULFILLED";
  subtotalCents: number;
  discountCents: number;
  couponCode: string | null;
  couponDiscountCents: number;
  shippingCents: number;
  totalCents: number;
  shippingAddress: Record<string, string>;
  notes: string | null;
  paymentProvider: string | null;
  paymentRef: string | null;
  placedAt: Date;
  carrier: string | null;
  trackingNumber: string | null;
  shippedAt: Date | null;
  items: {
    id: string;
    name: string;
    label: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
  }[];
};

export async function getAdminOrder(id: string): Promise<AdminOrderDetail | null> {
  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      orderNumber: true,
      email: true,
      status: true,
      subtotalCents: true,
      discountCents: true,
      couponCode: true,
      couponDiscountCents: true,
      shippingCents: true,
      totalCents: true,
      shippingAddress: true,
      notes: true,
      paymentProvider: true,
      paymentRef: true,
      placedAt: true,
      carrier: true,
      trackingNumber: true,
      shippedAt: true,
      items: {
        select: {
          id: true,
          productNameSnapshot: true,
          variantLabelSnapshot: true,
          quantity: true,
          unitPriceCents: true,
          lineTotalCents: true,
        },
      },
    },
  });
  if (!order) return null;

  const address: Record<string, string> = {};
  if (order.shippingAddress && typeof order.shippingAddress === "object") {
    for (const [key, value] of Object.entries(order.shippingAddress)) {
      if (typeof value === "string") address[key] = value;
    }
  }

  return {
    ...order,
    shippingAddress: address,
    items: order.items.map((item) => ({
      id: item.id,
      name: item.productNameSnapshot,
      label: item.variantLabelSnapshot,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      lineTotalCents: item.lineTotalCents,
    })),
  };
}

export type AdminSettings = {
  flatShippingCents: number;
  freeShippingThresholdCents: number;
  lowStockThreshold: number;
  kdvRatePercent: number;
  manualPaymentEnabled: boolean;
  manualPaymentInstructions: string | null;
};

export async function getAdminSettings(): Promise<AdminSettings> {
  const settings = await prisma.setting.findUnique({
    where: { id: 1 },
    select: {
      flatShippingCents: true,
      freeShippingThresholdCents: true,
      lowStockThreshold: true,
      kdvRatePercent: true,
      manualPaymentEnabled: true,
      manualPaymentInstructions: true,
    },
  });
  // The seed creates the singleton; fall back to zeros if it is ever missing
  // so the settings screen can recreate it on save.
  return (
    settings ?? {
      flatShippingCents: 0,
      freeShippingThresholdCents: 0,
      lowStockThreshold: 3,
      kdvRatePercent: 20,
      manualPaymentEnabled: false,
      manualPaymentInstructions: null,
    }
  );
}

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const now = new Date();
  const settings = await prisma.setting.findUnique({
    where: { id: 1 },
    select: { lowStockThreshold: true },
  });
  const lowStockThreshold = settings?.lowStockThreshold ?? 3;

  const [publishedCount, draftCount, activeSalesCount, lowStockCount, pendingOrdersCount, recent] =
    await Promise.all([
      prisma.product.count({ where: { status: "PUBLISHED" } }),
      prisma.product.count({ where: { status: "DRAFT" } }),
      prisma.sale.count({
        where: { endedEarly: false, startsAt: { lte: now }, endsAt: { gte: now } },
      }),
      // Made-to-order variants (R26) have no stock to run low on.
      prisma.variant.count({
        where: { isActive: true, trackStock: true, stock: { lt: lowStockThreshold } },
      }),
      prisma.order.count({ where: { status: "PENDING_PAYMENT" } }),
      prisma.order.findMany({
        orderBy: { placedAt: "desc" },
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalCents: true,
          placedAt: true,
          email: true,
        },
      }),
    ]);

  return {
    publishedCount,
    draftCount,
    activeSalesCount,
    lowStockCount,
    lowStockThreshold,
    pendingOrdersCount,
    recentOrders: recent,
  };
}
