"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-guard";
import { adminCopy, adminSettingsCopy } from "@/lib/copy/admin";
import { parseTryToKurus } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export type AdminFormState = { error: string | null; saved: boolean };

const moneyField = z
  .string()
  .transform((value) => parseTryToKurus(value))
  .refine((value): value is number => value !== null, adminSettingsCopy.invalidMoney);

const settingsSchema = z.object({
  flatShipping: moneyField,
  freeShippingThreshold: moneyField,
  lowStockThreshold: z.coerce.number().int().min(0, adminSettingsCopy.invalidThreshold).max(10000),
  manualPaymentEnabled: z.literal("on").nullable(),
  manualPaymentInstructions: z.string().trim().max(2000),
});

export async function saveSettings(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await assertAdmin();

  const parsed = settingsSchema.safeParse({
    flatShipping: formData.get("flatShipping"),
    freeShippingThreshold: formData.get("freeShippingThreshold"),
    lowStockThreshold: formData.get("lowStockThreshold"),
    manualPaymentEnabled: formData.get("manualPaymentEnabled"),
    manualPaymentInstructions: formData.get("manualPaymentInstructions"),
  });
  if (!parsed.success)
    return {
      error: parsed.error.issues[0]?.message ?? adminCopy.common.invalidInput,
      saved: false,
    };

  const data = {
    flatShippingCents: parsed.data.flatShipping,
    freeShippingThresholdCents: parsed.data.freeShippingThreshold,
    lowStockThreshold: parsed.data.lowStockThreshold,
    manualPaymentEnabled: parsed.data.manualPaymentEnabled === "on",
    manualPaymentInstructions: parsed.data.manualPaymentInstructions || null,
  };
  await prisma.setting.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });

  updateTag("settings");
  return { error: null, saved: true };
}
