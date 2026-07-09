"use server";

import { refresh, updateTag as invalidateTag } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

const reviewIdSchema = z.cuid();

async function setReviewStatus(formData: FormData, status: "APPROVED" | "REJECTED") {
  await assertAdmin();
  const parsed = reviewIdSchema.safeParse(formData.get("reviewId"));
  if (!parsed.success) return;

  await prisma.review.update({ where: { id: parsed.data }, data: { status } });
  invalidateTag("reviews");
  refresh();
}

export async function approveReviewAction(formData: FormData): Promise<void> {
  await setReviewStatus(formData, "APPROVED");
}

export async function rejectReviewAction(formData: FormData): Promise<void> {
  await setReviewStatus(formData, "REJECTED");
}
