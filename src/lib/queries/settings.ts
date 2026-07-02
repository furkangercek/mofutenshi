import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";

export type ShippingSettings = {
  flatShippingCents: number;
  freeShippingThresholdCents: number;
};

export async function getShippingSettings(): Promise<ShippingSettings | null> {
  "use cache";
  cacheTag("settings");
  cacheLife("hours");

  return prisma.setting.findUnique({
    where: { id: 1 },
    select: { flatShippingCents: true, freeShippingThresholdCents: true },
  });
}
