"use server";

import { updateTag as invalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-guard";
import { adminCopy, adminProductsCopy } from "@/lib/copy/admin";
import { parseTryToKurus } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { slugPattern } from "@/lib/slug";
import type { AdminFormState } from "@/lib/actions/admin-settings";

const optionValueSchema = z.object({
  key: z.string().min(1),
  id: z.string().optional(),
  value: z.string().trim().min(1, adminProductsCopy.optionValueRequired).max(60),
});

const optionTypeSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, adminProductsCopy.optionNameRequired).max(60),
  values: z.array(optionValueSchema).min(1, adminProductsCopy.optionValueRequired).max(30),
});

const variantSchema = z.object({
  id: z.string().optional(),
  valueKeys: z.array(z.string().min(1)).max(6),
  sku: z.string().trim().max(60),
  price: z.string().trim(),
  stock: z.coerce.number().int(adminProductsCopy.invalidStock).min(0).max(1000000),
  trackStock: z.boolean(),
  isActive: z.boolean(),
});

const productSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .trim()
    .min(2, adminProductsCopy.nameRequired)
    .max(200, adminProductsCopy.nameRequired),
  slug: z.string().trim().regex(slugPattern, adminProductsCopy.slugInvalid).max(120),
  description: z.string().trim().max(8000),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  isFeatured: z.boolean(),
  tagIds: z.array(z.string().min(1)).max(100),
  optionTypes: z.array(optionTypeSchema).max(4),
  variants: z.array(variantSchema).min(1).max(200),
});

type ProductInput = z.infer<typeof productSchema>;

// Prisma 7 driver adapters omit meta.target on P2002; the violated fields
// only appear in the message ("Unique constraint failed on the fields: ...").
function uniqueViolationTarget(error: unknown): string {
  if (typeof error !== "object" || error === null) return "";
  const { code, meta, message } = error as {
    code?: string;
    meta?: { target?: string[] | string };
    message?: string;
  };
  if (code !== "P2002") return "";
  const target = Array.isArray(meta?.target)
    ? meta.target.join(",")
    : typeof meta?.target === "string"
      ? meta.target
      : "";
  return target || message || "P2002";
}

function fail(error: string): AdminFormState {
  return { error, saved: false };
}

// Cross-field checks zod cannot express: unique option names/values, the
// variant list exactly covering the option-value combinations, unique SKUs.
function validateStructure(input: ProductInput): string | null {
  const typeNames = input.optionTypes.map((t) => t.name.toLocaleLowerCase("tr-TR"));
  if (new Set(typeNames).size !== typeNames.length) return adminProductsCopy.optionNameRequired;

  for (const type of input.optionTypes) {
    const values = type.values.map((v) => v.value.toLocaleLowerCase("tr-TR"));
    if (new Set(values).size !== values.length) return adminProductsCopy.optionValueRequired;
    const keys = type.values.map((v) => v.key);
    if (new Set(keys).size !== keys.length) return adminProductsCopy.variantMismatch;
  }

  const expectedCount = input.optionTypes.reduce((count, type) => count * type.values.length, 1);
  if (input.variants.length !== expectedCount) return adminProductsCopy.variantMismatch;

  const signatures = new Set<string>();
  for (const variant of input.variants) {
    if (variant.valueKeys.length !== input.optionTypes.length)
      return adminProductsCopy.variantMismatch;
    for (const [index, type] of input.optionTypes.entries()) {
      const key = variant.valueKeys[index];
      if (!type.values.some((v) => v.key === key)) return adminProductsCopy.variantMismatch;
    }
    signatures.add([...variant.valueKeys].sort().join("|"));
  }
  if (signatures.size !== input.variants.length) return adminProductsCopy.variantMismatch;

  const skus = input.variants.map((v) => v.sku).filter(Boolean);
  if (new Set(skus).size !== skus.length) return adminProductsCopy.skuTaken;

  for (const variant of input.variants) {
    if (parseTryToKurus(variant.price) === null) return adminProductsCopy.invalidPrice;
  }
  return null;
}

export async function saveProductAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await assertAdmin();

  // Basics arrive as plain form fields; the option/variant structure is a
  // JSON payload maintained by the client matrix.
  let structure: unknown;
  try {
    structure = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return fail(adminCopy.common.invalidInput);
  }
  if (typeof structure !== "object" || structure === null)
    return fail(adminCopy.common.invalidInput);

  const parsed = productSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    status: formData.get("status"),
    isFeatured: formData.get("isFeatured") === "on",
    tagIds: formData.getAll("tagIds").map(String),
    optionTypes: (structure as { optionTypes?: unknown }).optionTypes ?? [],
    variants: (structure as { variants?: unknown }).variants ?? [],
  });
  if (!parsed.success)
    return fail(parsed.error.issues[0]?.message ?? adminCopy.common.invalidInput);
  const input = parsed.data;

  const structureError = validateStructure(input);
  if (structureError) return fail(structureError);

  if (input.tagIds.length > 0) {
    const tagCount = await prisma.tag.count({ where: { id: { in: input.tagIds } } });
    if (tagCount !== input.tagIds.length) return fail(adminCopy.common.invalidInput);
  }

  let productId = input.id ?? null;
  try {
    productId = await prisma.$transaction(async (tx) => {
      const core = {
        name: input.name,
        slug: input.slug,
        description: input.description,
        status: input.status,
        isFeatured: input.isFeatured,
      };

      let id: string;
      if (input.id) {
        const existing = await tx.product.findUnique({
          where: { id: input.id },
          select: { publishedAt: true },
        });
        if (!existing) throw new Error("product-not-found");
        await tx.product.update({
          where: { id: input.id },
          data: {
            ...core,
            // First publish stamps publishedAt (drives New Arrivals ordering).
            ...(input.status === "PUBLISHED" && !existing.publishedAt
              ? { publishedAt: new Date() }
              : {}),
          },
        });
        id = input.id;
      } else {
        const created = await tx.product.create({
          data: {
            ...core,
            ...(input.status === "PUBLISHED" ? { publishedAt: new Date() } : {}),
          },
          select: { id: true },
        });
        id = created.id;
      }

      await tx.productTag.deleteMany({
        where: { productId: id, tagId: { notIn: input.tagIds } },
      });
      if (input.tagIds.length > 0) {
        await tx.productTag.createMany({
          data: input.tagIds.map((tagId) => ({ productId: id, tagId })),
          skipDuplicates: true,
        });
      }

      // --- Option types/values: update by id, create new, drop removed. ---
      const existingTypes = await tx.optionType.findMany({
        where: { productId: id },
        select: { id: true, values: { select: { id: true } } },
      });
      const existingTypeIds = new Set(existingTypes.map((t) => t.id));
      const existingValueIds = new Set(existingTypes.flatMap((t) => t.values.map((v) => v.id)));

      for (const type of input.optionTypes) {
        if (type.id && !existingTypeIds.has(type.id)) throw new Error("stale-structure");
        for (const value of type.values) {
          if (value.id && !existingValueIds.has(value.id)) throw new Error("stale-structure");
        }
      }

      const keptTypeIds = input.optionTypes.flatMap((t) => (t.id ? [t.id] : []));
      await tx.optionType.deleteMany({ where: { productId: id, id: { notIn: keptTypeIds } } });

      // Maps every payload value key to its database id.
      const valueIdByKey = new Map<string, string>();
      for (const [typeIndex, type] of input.optionTypes.entries()) {
        let typeId: string;
        if (type.id) {
          typeId = type.id;
          await tx.optionType.update({
            where: { id: typeId },
            data: { name: type.name, sortOrder: typeIndex },
          });
          const keptValueIds = type.values.flatMap((v) => (v.id ? [v.id] : []));
          await tx.optionValue.deleteMany({
            where: { optionTypeId: typeId, id: { notIn: keptValueIds } },
          });
        } else {
          const created = await tx.optionType.create({
            data: { productId: id, name: type.name, sortOrder: typeIndex },
            select: { id: true },
          });
          typeId = created.id;
        }

        for (const [valueIndex, value] of type.values.entries()) {
          if (value.id) {
            await tx.optionValue.update({
              where: { id: value.id },
              data: { value: value.value, sortOrder: valueIndex },
            });
            valueIdByKey.set(value.key, value.id);
          } else {
            const created = await tx.optionValue.create({
              data: { optionTypeId: typeId, value: value.value, sortOrder: valueIndex },
              select: { id: true },
            });
            valueIdByKey.set(value.key, created.id);
          }
        }
      }

      // --- Variants: update kept rows, create new combinations, drop the rest.
      // Deleting a variant cascades cart lines (they were purchasable no
      // longer) and SetNulls order items, whose snapshots keep history intact.
      const existingVariants = await tx.variant.findMany({
        where: { productId: id },
        select: { id: true, optionValues: { select: { optionValueId: true } } },
      });
      const existingVariantById = new Map(existingVariants.map((v) => [v.id, v]));

      const keptVariantIds = input.variants.flatMap((v) => (v.id ? [v.id] : []));
      await tx.variant.deleteMany({ where: { productId: id, id: { notIn: keptVariantIds } } });

      for (const variant of input.variants) {
        const priceCents = parseTryToKurus(variant.price);
        if (priceCents === null) throw new Error("invalid-price");
        const data = {
          sku: variant.sku || null,
          priceCents,
          stock: variant.stock,
          trackStock: variant.trackStock,
          isActive: variant.isActive,
        };
        const valueIds = variant.valueKeys.map((key) => {
          const valueId = valueIdByKey.get(key);
          if (!valueId) throw new Error("stale-structure");
          return valueId;
        });

        if (variant.id) {
          const existing = existingVariantById.get(variant.id);
          if (!existing) throw new Error("stale-structure");
          const currentSignature = existing.optionValues
            .map((v) => v.optionValueId)
            .sort()
            .join("|");
          if (currentSignature !== [...valueIds].sort().join("|"))
            throw new Error("stale-structure");
          await tx.variant.update({ where: { id: variant.id }, data });
        } else {
          await tx.variant.create({
            data: {
              productId: id,
              ...data,
              optionValues: { create: valueIds.map((optionValueId) => ({ optionValueId })) },
            },
          });
        }
      }

      return id;
    });
  } catch (error) {
    const target = uniqueViolationTarget(error);
    if (target.includes("slug")) return fail(adminProductsCopy.slugTaken);
    if (target.includes("sku")) return fail(adminProductsCopy.skuTaken);
    if (error instanceof Error && error.message === "product-not-found")
      return fail(adminProductsCopy.notFound);
    if (error instanceof Error && error.message === "stale-structure")
      return fail(adminProductsCopy.variantMismatch);
    if (error instanceof Error && error.message === "invalid-price")
      return fail(adminProductsCopy.invalidPrice);
    throw error;
  }

  invalidateTag("catalog");
  // Redirect rather than re-render: the form's client-side option/variant
  // keys are stale after a save (new rows now have DB ids); a fresh mount
  // rebuilds them. Creates land on the edit page so images can follow.
  if (!input.id) redirect(`/admin/products/${productId}`);
  redirect("/admin/products");
}

export async function deleteProductAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await assertAdmin();

  const id = z.string().min(1).safeParse(formData.get("id"));
  if (!id.success) return fail(adminCopy.common.invalidInput);

  const product = await prisma.product.findUnique({ where: { id: id.data }, select: { id: true } });
  if (!product) return fail(adminProductsCopy.notFound);

  // Cascades variants → cart lines; order items SetNull and keep snapshots.
  await prisma.product.delete({ where: { id: id.data } });

  invalidateTag("catalog");
  redirect("/admin/products");
}
