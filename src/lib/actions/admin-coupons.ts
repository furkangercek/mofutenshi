"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-guard";
import { adminCopy } from "@/lib/copy/admin";
import { adminCouponsCopy } from "@/lib/copy/coupons";
import { COUPON_CODE_PATTERN, normalizeCouponCode } from "@/lib/coupons";
import { parseIstanbulInput } from "@/lib/datetime";
import { parseTryToKurus } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import type { AdminFormState } from "@/lib/actions/admin-settings";

const couponSchema = z.object({
  id: z.string().optional(),
  code: z.string().trim().max(64),
  percentOff: z.string().trim(),
  startsAt: z.string(),
  endsAt: z.string(),
  minSubtotal: z.string().trim().default(""),
  maxRedemptions: z.string().trim().default(""),
  isActive: z.string().nullish(),
});

function fail(error: string): AdminFormState {
  return { error, saved: false };
}

export async function saveCouponAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await assertAdmin();

  const parsed = couponSchema.safeParse({
    id: formData.get("id") || undefined,
    code: formData.get("code"),
    percentOff: formData.get("percentOff"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    minSubtotal: formData.get("minSubtotal"),
    maxRedemptions: formData.get("maxRedemptions"),
    isActive: formData.get("isActive"),
  });
  if (!parsed.success)
    return fail(parsed.error.issues[0]?.message ?? adminCopy.common.invalidInput);
  const input = parsed.data;

  const code = normalizeCouponCode(input.code);
  if (!COUPON_CODE_PATTERN.test(code)) return fail(adminCouponsCopy.invalidCode);

  const percentOff = Number(input.percentOff);
  if (!Number.isInteger(percentOff) || percentOff < 1 || percentOff > 99)
    return fail(adminCouponsCopy.invalidPercent);

  const startsAt = parseIstanbulInput(input.startsAt);
  const endsAt = parseIstanbulInput(input.endsAt);
  if (!startsAt || !endsAt || endsAt <= startsAt) return fail(adminCouponsCopy.invalidDates);

  let minSubtotalCents = 0;
  if (input.minSubtotal) {
    const kurus = parseTryToKurus(input.minSubtotal);
    if (kurus === null) return fail(adminCouponsCopy.invalidMin);
    minSubtotalCents = kurus;
  }

  let maxRedemptions: number | null = null;
  if (input.maxRedemptions) {
    const max = Number(input.maxRedemptions);
    if (!Number.isInteger(max) || max < 1) return fail(adminCouponsCopy.invalidMax);
    maxRedemptions = max;
  }

  const data = {
    code,
    percentOff,
    startsAt,
    endsAt,
    minSubtotalCents,
    maxRedemptions,
    isActive: input.isActive === "on",
  };

  try {
    if (input.id) {
      const updated = await prisma.coupon.updateMany({ where: { id: input.id }, data });
      if (updated.count === 0) return fail(adminCouponsCopy.notFound);
    } else {
      await prisma.coupon.create({ data });
    }
  } catch (error) {
    // Coupon has a single unique constraint (code), so any P2002 here is a
    // duplicate code — no meta.target parsing needed (driver-adapter gotcha).
    if (
      typeof error === "object" &&
      error !== null &&
      (error as { code?: string }).code === "P2002"
    )
      return fail(adminCouponsCopy.duplicateCode);
    throw error;
  }

  redirect("/admin/coupons");
}

export async function deleteCouponAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await assertAdmin();

  const id = z.string().min(1).safeParse(formData.get("id"));
  if (!id.success) return fail(adminCopy.common.invalidInput);

  const deleted = await prisma.coupon.deleteMany({ where: { id: id.data } });
  if (deleted.count === 0) return fail(adminCouponsCopy.notFound);

  redirect("/admin/coupons");
}
