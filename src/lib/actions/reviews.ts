"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { reviewsCopy } from "@/lib/copy/reviews";
import { prisma } from "@/lib/prisma";
import { hasPurchasedProduct } from "@/lib/queries/reviews";
import { consumeRateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request-context";

export type ReviewFormState = { error: string | null; success?: boolean };

const reviewSchema = z.object({
  productId: z.cuid(),
  rating: z.coerce.number<number>().int().min(1, reviewsCopy.ratingRequired).max(5),
  text: z.string().trim().max(1000, reviewsCopy.textTooLong).default(""),
});

export async function submitReviewAction(
  _prev: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { error: reviewsCopy.notAllowed };

  const parsed = reviewSchema.safeParse({
    productId: formData.get("productId"),
    rating: formData.get("rating") ?? undefined,
    text: formData.get("text"),
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? reviewsCopy.invalidInput };

  if (!consumeRateLimit(`review:${await clientIp()}:${userId}`, 10, 60 * 60 * 1000))
    return { error: reviewsCopy.tooManyAttempts };

  // R21: verified buyers only — the UI gate alone is not access control.
  if (!(await hasPurchasedProduct(userId, parsed.data.productId)))
    return { error: reviewsCopy.notAllowed };

  const data = {
    rating: parsed.data.rating,
    text: parsed.data.text || null,
    status: "PENDING" as const,
  };
  await prisma.review.upsert({
    where: { productId_userId: { productId: parsed.data.productId, userId } },
    create: { ...data, productId: parsed.data.productId, userId },
    update: data, // editing resets to PENDING for re-approval (R21)
  });

  // Editing an APPROVED review must pull it from the public list.
  updateTag("reviews");
  refresh();
  return { error: null, success: true };
}
