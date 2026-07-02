import { prisma } from "@/lib/prisma";

export type NavTag = {
  id: string;
  name: string;
  slug: string;
  children: { id: string; name: string; slug: string }[];
};

export async function getNavTags(): Promise<NavTag[]> {
  return prisma.tag.findMany({
    where: { type: "HIERARCHICAL", parentId: null },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      children: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, slug: true },
      },
    },
  });
}
