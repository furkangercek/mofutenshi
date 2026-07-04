"use server";

import { updateTag as invalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-guard";
import { adminCopy, adminSalesCopy } from "@/lib/copy/admin";
import { parseIstanbulInput } from "@/lib/datetime";
import { parseTryToKurus } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import type { AdminFormState } from "@/lib/actions/admin-settings";

const saleSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, adminSalesCopy.nameRequired).max(100, adminSalesCopy.nameRequired),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.string().trim(),
  startsAt: z.string(),
  endsAt: z.string(),
  productIds: z.array(z.string().min(1)).max(500),
  tagIds: z.array(z.string().min(1)).max(100),
});

function fail(error: string): AdminFormState {
  return { error, saved: false };
}

export async function saveSaleAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await assertAdmin();

  const parsed = saleSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    type: formData.get("type"),
    value: formData.get("value"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    productIds: formData.getAll("productIds").map(String),
    tagIds: formData.getAll("tagIds").map(String),
  });
  if (!parsed.success)
    return fail(parsed.error.issues[0]?.message ?? adminCopy.common.invalidInput);
  const input = parsed.data;

  // PERCENT stores the integer percentage; FIXED stores kuruş (pricing.ts contract).
  let value: number;
  if (input.type === "PERCENT") {
    const percent = Number(input.value);
    if (!Number.isInteger(percent) || percent < 1 || percent > 99)
      return fail(adminSalesCopy.invalidPercent);
    value = percent;
  } else {
    const kurus = parseTryToKurus(input.value);
    if (kurus === null || kurus === 0) return fail(adminSalesCopy.invalidFixed);
    value = kurus;
  }

  const startsAt = parseIstanbulInput(input.startsAt);
  const endsAt = parseIstanbulInput(input.endsAt);
  if (!startsAt || !endsAt || endsAt <= startsAt) return fail(adminSalesCopy.invalidDates);

  if (input.productIds.length === 0 && input.tagIds.length === 0)
    return fail(adminSalesCopy.scopeRequired);

  const [productCount, tagCount] = await Promise.all([
    input.productIds.length
      ? prisma.product.count({ where: { id: { in: input.productIds } } })
      : Promise.resolve(0),
    input.tagIds.length
      ? prisma.tag.count({ where: { id: { in: input.tagIds } } })
      : Promise.resolve(0),
  ]);
  if (productCount !== input.productIds.length || tagCount !== input.tagIds.length)
    return fail(adminCopy.common.invalidInput);

  const core = { name: input.name, type: input.type, value, startsAt, endsAt };

  await prisma.$transaction(async (tx) => {
    let saleId: string;
    if (input.id) {
      const existing = await tx.sale.findUnique({ where: { id: input.id }, select: { id: true } });
      if (!existing) throw new Error("sale-not-found");
      await tx.sale.update({ where: { id: input.id }, data: core });
      saleId = input.id;
      await tx.saleProduct.deleteMany({
        where: { saleId, productId: { notIn: input.productIds } },
      });
      await tx.saleTag.deleteMany({ where: { saleId, tagId: { notIn: input.tagIds } } });
    } else {
      const created = await tx.sale.create({ data: core, select: { id: true } });
      saleId = created.id;
    }

    if (input.productIds.length > 0) {
      await tx.saleProduct.createMany({
        data: input.productIds.map((productId) => ({ saleId, productId })),
        skipDuplicates: true,
      });
    }
    if (input.tagIds.length > 0) {
      await tx.saleTag.createMany({
        data: input.tagIds.map((tagId) => ({ saleId, tagId })),
        skipDuplicates: true,
      });
    }
  });

  invalidateTag("catalog");
  redirect("/admin/sales");
}

export async function endSaleEarlyAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await assertAdmin();

  const id = z.string().min(1).safeParse(formData.get("id"));
  if (!id.success) return fail(adminCopy.common.invalidInput);

  // Flag + clamp endsAt so "ended early" reads truthfully in the list and
  // the active-sale query short-circuits either way.
  const now = new Date();
  const updated = await prisma.sale.updateMany({
    where: { id: id.data, endedEarly: false, endsAt: { gt: now } },
    data: { endedEarly: true, endsAt: now },
  });
  if (updated.count === 0) return fail(adminSalesCopy.notFound);

  invalidateTag("catalog");
  redirect("/admin/sales");
}

export async function deleteSaleAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await assertAdmin();

  const id = z.string().min(1).safeParse(formData.get("id"));
  if (!id.success) return fail(adminCopy.common.invalidInput);

  const sale = await prisma.sale.findUnique({ where: { id: id.data }, select: { id: true } });
  if (!sale) return fail(adminSalesCopy.notFound);

  await prisma.sale.delete({ where: { id: id.data } });

  invalidateTag("catalog");
  redirect("/admin/sales");
}
