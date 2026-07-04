"use server";

import { refresh, updateTag as invalidateTag } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-guard";
import { adminCopy, adminInventoryCopy } from "@/lib/copy/admin";
import { prisma } from "@/lib/prisma";
import type { AdminFormState } from "@/lib/actions/admin-settings";

const stockSchema = z.object({
  variantId: z.string().min(1),
  stock: z.coerce.number().int(adminInventoryCopy.invalidStock).min(0).max(1000000),
});

export async function updateStockAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await assertAdmin();

  const parsed = stockSchema.safeParse({
    variantId: formData.get("variantId"),
    stock: formData.get("stock"),
  });
  if (!parsed.success)
    return {
      error: parsed.error.issues[0]?.message ?? adminCopy.common.invalidInput,
      saved: false,
    };

  const updated = await prisma.variant.updateMany({
    where: { id: parsed.data.variantId },
    data: { stock: parsed.data.stock },
  });
  if (updated.count === 0) return { error: adminInventoryCopy.notFound, saved: false };

  invalidateTag("catalog");
  refresh();
  return { error: null, saved: true };
}
