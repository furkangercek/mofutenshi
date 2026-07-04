"use server";

import { updateTag as invalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-guard";
import { adminCopy, adminTagsCopy } from "@/lib/copy/admin";
import { prisma } from "@/lib/prisma";
import { slugPattern } from "@/lib/slug";
import type { AdminFormState } from "@/lib/actions/admin-settings";

const tagSchema = z.object({
  id: z.string().trim().optional(),
  name: z.string().trim().min(2, adminTagsCopy.nameRequired).max(60, adminTagsCopy.nameRequired),
  slug: z.string().trim().regex(slugPattern, adminTagsCopy.slugInvalid).max(80),
  type: z.enum(["HIERARCHICAL", "FLAT"], { message: adminCopy.common.invalidInput }),
  parentId: z.string().trim().optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999),
});

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

// Storefront caches touched by tag changes: nav/tag tree ("tags") and the
// product snapshot that carries tag ids per product ("catalog").
function invalidateTagCaches() {
  invalidateTag("tags");
  invalidateTag("catalog");
}

export async function saveTagAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await assertAdmin();

  const parsed = tagSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    slug: formData.get("slug"),
    type: formData.get("type"),
    parentId: formData.get("parentId") || undefined,
    sortOrder: formData.get("sortOrder"),
  });
  if (!parsed.success)
    return {
      error: parsed.error.issues[0]?.message ?? adminCopy.common.invalidInput,
      saved: false,
    };
  const input = parsed.data;

  // A flat tag never nests; hierarchy stays two levels deep (PRD §3).
  const parentId = input.type === "HIERARCHICAL" ? (input.parentId ?? null) : null;
  if (parentId) {
    if (parentId === input.id) return { error: adminTagsCopy.parentInvalid, saved: false };
    const parent = await prisma.tag.findUnique({
      where: { id: parentId },
      select: { type: true, parentId: true },
    });
    if (!parent || parent.type !== "HIERARCHICAL" || parent.parentId)
      return { error: adminTagsCopy.parentInvalid, saved: false };
  }

  if (input.id) {
    const existing = await prisma.tag.findUnique({
      where: { id: input.id },
      select: { _count: { select: { children: true } } },
    });
    if (!existing) return { error: adminTagsCopy.notFound, saved: false };
    if (existing._count.children > 0 && (parentId || input.type === "FLAT"))
      return { error: adminTagsCopy.parentLockedHint, saved: false };
  }

  const data = {
    name: input.name,
    slug: input.slug,
    type: input.type,
    parentId,
    sortOrder: input.sortOrder,
  };
  try {
    if (input.id) {
      await prisma.tag.update({ where: { id: input.id }, data });
    } else {
      await prisma.tag.create({ data });
    }
  } catch (error) {
    if (isUniqueViolation(error)) return { error: adminTagsCopy.slugTaken, saved: false };
    throw error;
  }

  invalidateTagCaches();
  redirect("/admin/tags");
}

export async function deleteTagAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await assertAdmin();

  const id = z.string().min(1).safeParse(formData.get("id"));
  if (!id.success) return { error: adminCopy.common.invalidInput, saved: false };

  const tag = await prisma.tag.findUnique({
    where: { id: id.data },
    select: { _count: { select: { children: true } } },
  });
  if (!tag) return { error: adminTagsCopy.notFound, saved: false };
  // Children would silently become top-level (SetNull) and reshuffle the nav;
  // make the owner deal with them explicitly first.
  if (tag._count.children > 0) return { error: adminTagsCopy.deleteBlockedChildren, saved: false };

  // ProductTag/SaleTag rows cascade; products themselves are never touched.
  await prisma.tag.delete({ where: { id: id.data } });

  invalidateTagCaches();
  redirect("/admin/tags");
}
