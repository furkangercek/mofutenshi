"use server";

import { randomUUID } from "node:crypto";
import { refresh, updateTag as invalidateTag } from "next/cache";
import sharp from "sharp";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-guard";
import { adminCopy, adminImagesCopy } from "@/lib/copy/admin";
import { prisma } from "@/lib/prisma";
import { storageDelete, storagePut, uploadsEnabled } from "@/lib/storage";
import type { AdminFormState } from "@/lib/actions/admin-settings";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

function fail(error: string): AdminFormState {
  return { error, saved: false };
}

function done(): AdminFormState {
  refresh();
  return { error: null, saved: true };
}

export async function uploadImageAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await assertAdmin();
  if (!uploadsEnabled) return fail(adminImagesCopy.r2Missing);

  const parsed = z
    .object({
      productId: z.string().min(1),
      alt: z.string().trim().min(3, adminImagesCopy.altRequired).max(300),
    })
    .safeParse({ productId: formData.get("productId"), alt: formData.get("alt") });
  if (!parsed.success)
    return fail(parsed.error.issues[0]?.message ?? adminCopy.common.invalidInput);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_UPLOAD_BYTES)
    return fail(adminImagesCopy.invalidFile);
  if (!ACCEPTED_TYPES.has(file.type)) return fail(adminImagesCopy.invalidFile);

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
    select: { id: true, _count: { select: { images: true } } },
  });
  if (!product) return fail(adminCopy.common.notFoundRow);

  let optimized: Buffer;
  try {
    // EXIF-rotate, cap the long edge, convert to webp — one optimized source;
    // next/image derives responsive sizes at delivery time.
    optimized = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize(2000, 2000, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch (error) {
    console.error("image optimization failed", error);
    return fail(adminImagesCopy.invalidFile);
  }

  const key = `products/${product.id}/${randomUUID()}.webp`;
  try {
    await storagePut(key, optimized, "image/webp");
  } catch (error) {
    console.error("image upload failed", error);
    return fail(adminImagesCopy.uploadFailed);
  }

  const maxSort = await prisma.productImage.aggregate({
    where: { productId: product.id },
    _max: { sortOrder: true },
  });
  await prisma.productImage.create({
    data: {
      productId: product.id,
      key,
      alt: parsed.data.alt,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      isPrimary: product._count.images === 0,
    },
  });

  invalidateTag("catalog");
  return done();
}

const imageIdSchema = z.object({ imageId: z.string().min(1) });

async function loadImage(imageId: string) {
  return prisma.productImage.findUnique({
    where: { id: imageId },
    select: { id: true, productId: true, key: true, isPrimary: true, sortOrder: true },
  });
}

export async function updateImageAltAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await assertAdmin();

  const parsed = z
    .object({
      imageId: z.string().min(1),
      alt: z.string().trim().min(3, adminImagesCopy.altRequired).max(300),
    })
    .safeParse({ imageId: formData.get("imageId"), alt: formData.get("alt") });
  if (!parsed.success)
    return fail(parsed.error.issues[0]?.message ?? adminCopy.common.invalidInput);

  const image = await loadImage(parsed.data.imageId);
  if (!image) return fail(adminImagesCopy.notFound);

  await prisma.productImage.update({
    where: { id: image.id },
    data: { alt: parsed.data.alt },
  });

  invalidateTag("catalog");
  return done();
}

export async function setPrimaryImageAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await assertAdmin();

  const parsed = imageIdSchema.safeParse({ imageId: formData.get("imageId") });
  if (!parsed.success) return fail(adminCopy.common.invalidInput);

  const image = await loadImage(parsed.data.imageId);
  if (!image) return fail(adminImagesCopy.notFound);

  await prisma.$transaction([
    prisma.productImage.updateMany({
      where: { productId: image.productId },
      data: { isPrimary: false },
    }),
    prisma.productImage.update({ where: { id: image.id }, data: { isPrimary: true } }),
  ]);

  invalidateTag("catalog");
  return done();
}

export async function moveImageAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await assertAdmin();

  const parsed = z
    .object({ imageId: z.string().min(1), direction: z.enum(["up", "down"]) })
    .safeParse({ imageId: formData.get("imageId"), direction: formData.get("direction") });
  if (!parsed.success) return fail(adminCopy.common.invalidInput);

  const image = await loadImage(parsed.data.imageId);
  if (!image) return fail(adminImagesCopy.notFound);

  const siblings = await prisma.productImage.findMany({
    where: { productId: image.productId },
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });
  const index = siblings.findIndex((s) => s.id === image.id);
  const targetIndex = parsed.data.direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= siblings.length) return { error: null, saved: false };

  const reordered = [...siblings];
  [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
  await prisma.$transaction(
    reordered.map((sibling, sortOrder) =>
      prisma.productImage.update({ where: { id: sibling.id }, data: { sortOrder } }),
    ),
  );

  invalidateTag("catalog");
  return done();
}

export async function deleteImageAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await assertAdmin();

  const parsed = imageIdSchema.safeParse({ imageId: formData.get("imageId") });
  if (!parsed.success) return fail(adminCopy.common.invalidInput);

  const image = await loadImage(parsed.data.imageId);
  if (!image) return fail(adminImagesCopy.notFound);

  await prisma.productImage.delete({ where: { id: image.id } });
  if (image.isPrimary) {
    const next = await prisma.productImage.findFirst({
      where: { productId: image.productId },
      orderBy: { sortOrder: "asc" },
      select: { id: true },
    });
    if (next)
      await prisma.productImage.update({ where: { id: next.id }, data: { isPrimary: true } });
  }

  // Storage cleanup is best-effort: a stray object/file is harmless, a
  // broken DB row is not.
  try {
    await storageDelete(image.key);
  } catch (error) {
    console.error("image delete failed", error);
  }

  invalidateTag("catalog");
  return done();
}
