import {
  MAX_ADDRESSES_PER_USER,
  autoAddressTitle,
  sameAddress,
  type SavedAddress,
} from "@/lib/addresses";
import type { ShippingAddress } from "@/lib/payments/types";
import { prisma } from "@/lib/prisma";

// Per-user data: never "use cache".

const savedAddressSelect = {
  id: true,
  title: true,
  fullName: true,
  phone: true,
  address: true,
  city: true,
  district: true,
  postalCode: true,
  isDefault: true,
} as const;

export async function getAddressesForUser(userId: string): Promise<SavedAddress[]> {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    select: savedAddressSelect,
  });
}

export async function getAddressForUser(
  userId: string,
  addressId: string,
): Promise<SavedAddress | null> {
  return prisma.address.findFirst({
    where: { id: addressId, userId },
    select: savedAddressSelect,
  });
}

// Best-effort save from the checkout "save this address" checkbox: skips
// duplicates and the cap silently, and must never fail the order flow.
export async function saveAddressFromCheckout(
  userId: string,
  shipping: ShippingAddress,
): Promise<void> {
  try {
    const existing = await getAddressesForUser(userId);
    if (existing.length >= MAX_ADDRESSES_PER_USER) return;
    const candidate = { ...shipping, postalCode: shipping.postalCode ?? null };
    if (existing.some((saved) => sameAddress(saved, candidate))) return;

    await prisma.address.create({
      data: {
        userId,
        title: autoAddressTitle(shipping.district, shipping.city),
        fullName: shipping.fullName,
        phone: shipping.phone,
        address: shipping.address,
        city: shipping.city,
        district: shipping.district,
        postalCode: shipping.postalCode || null,
        isDefault: existing.length === 0,
      },
    });
  } catch (error) {
    console.error("saveAddressFromCheckout failed", error);
  }
}
