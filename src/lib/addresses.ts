import { z } from "zod";
import { addressesCopy } from "@/lib/copy/addresses";

// Client-safe module: types, validation, and pure helpers only — DB access
// lives in src/lib/address-book.ts.

export const MAX_ADDRESSES_PER_USER = 10;
export const NEW_ADDRESS_OPTION = "new";

export const addressInputSchema = z.object({
  title: z.string().trim().min(2, addressesCopy.titleRequired).max(40, addressesCopy.invalidInput),
  fullName: z
    .string()
    .trim()
    .min(3, addressesCopy.nameRequired)
    .max(100, addressesCopy.invalidInput),
  phone: z.string().trim().min(10, addressesCopy.phoneRequired).max(20, addressesCopy.invalidInput),
  address: z
    .string()
    .trim()
    .min(10, addressesCopy.addressRequired)
    .max(500, addressesCopy.invalidInput),
  city: z.string().trim().min(2, addressesCopy.cityRequired).max(50, addressesCopy.invalidInput),
  district: z
    .string()
    .trim()
    .min(2, addressesCopy.districtRequired)
    .max(50, addressesCopy.invalidInput),
  postalCode: z.string().trim().max(10, addressesCopy.invalidInput).default(""),
});

export type SavedAddress = {
  id: string;
  title: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  postalCode: string | null;
  isDefault: boolean;
};

type AddressFields = Omit<SavedAddress, "id" | "title" | "isDefault">;

const normalize = (value: string | null | undefined) =>
  (value ?? "").trim().toLocaleLowerCase("tr-TR").replace(/\s+/g, " ");

export function sameAddress(a: AddressFields, b: AddressFields): boolean {
  return (
    normalize(a.fullName) === normalize(b.fullName) &&
    normalize(a.phone) === normalize(b.phone) &&
    normalize(a.address) === normalize(b.address) &&
    normalize(a.city) === normalize(b.city) &&
    normalize(a.district) === normalize(b.district) &&
    normalize(a.postalCode) === normalize(b.postalCode)
  );
}

export function autoAddressTitle(district: string, city: string): string {
  return `${district} / ${city}`.slice(0, 40);
}
