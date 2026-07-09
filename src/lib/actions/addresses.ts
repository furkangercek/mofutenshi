"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { MAX_ADDRESSES_PER_USER, addressInputSchema } from "@/lib/addresses";
import { auth } from "@/lib/auth";
import { addressesCopy } from "@/lib/copy/addresses";
import { prisma } from "@/lib/prisma";

export type AddressFormState = { error: string | null };

async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login?callbackUrl=%2Faccount%2Faddresses");
  return userId;
}

export async function saveAddressAction(
  _prev: AddressFormState,
  formData: FormData,
): Promise<AddressFormState> {
  const userId = await requireUserId();

  const parsed = addressInputSchema.safeParse({
    title: formData.get("title"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    city: formData.get("city"),
    district: formData.get("district"),
    postalCode: formData.get("postalCode"),
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? addressesCopy.invalidInput };

  const data = { ...parsed.data, postalCode: parsed.data.postalCode || null };

  const addressId = z.cuid().safeParse(formData.get("addressId"));
  if (addressId.success) {
    const updated = await prisma.address.updateMany({
      where: { id: addressId.data, userId },
      data,
    });
    if (updated.count === 0) return { error: addressesCopy.notFound };
  } else {
    const count = await prisma.address.count({ where: { userId } });
    if (count >= MAX_ADDRESSES_PER_USER) return { error: addressesCopy.tooMany };
    await prisma.address.create({ data: { ...data, userId, isDefault: count === 0 } });
  }

  refresh();
  redirect("/account/addresses");
}

const addressIdSchema = z.cuid();

export async function deleteAddressAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const parsed = addressIdSchema.safeParse(formData.get("addressId"));
  if (!parsed.success) return;

  await prisma.address.deleteMany({ where: { id: parsed.data, userId } });
  refresh();
}

export async function setDefaultAddressAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const parsed = addressIdSchema.safeParse(formData.get("addressId"));
  if (!parsed.success) return;

  await prisma.$transaction(async (tx) => {
    const owned = await tx.address.updateMany({
      where: { id: parsed.data, userId },
      data: { isDefault: true },
    });
    if (owned.count === 0) return;
    await tx.address.updateMany({
      where: { userId, id: { not: parsed.data } },
      data: { isDefault: false },
    });
  });
  refresh();
}
