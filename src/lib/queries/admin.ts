import { prisma } from "@/lib/prisma";

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

export type AdminSettings = {
  flatShippingCents: number;
  freeShippingThresholdCents: number;
  lowStockThreshold: number;
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
      prisma.variant.count({ where: { isActive: true, stock: { lt: lowStockThreshold } } }),
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
