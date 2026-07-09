"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const productIdSchema = z.cuid();

// Toggle add/remove: the button is the single surface, so a replayed form
// post just flips back — no error states to surface.
export async function toggleWishlistAction(formData: FormData): Promise<void> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return;

  const parsed = productIdSchema.safeParse(formData.get("productId"));
  if (!parsed.success) return;
  const productId = parsed.data;

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId, productId } },
    select: { id: true },
  });
  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
  } else {
    const product = await prisma.product.findUnique({
      where: { id: productId, status: "PUBLISHED" },
      select: { id: true },
    });
    if (!product) return;
    await prisma.wishlistItem.create({ data: { userId, productId } });
  }
  refresh();
}
