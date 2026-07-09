import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AddressForm } from "@/components/account/address-form";
import { getAddressesForUser } from "@/lib/address-book";
import { MAX_ADDRESSES_PER_USER } from "@/lib/addresses";
import { auth } from "@/lib/auth";
import { addressesCopy } from "@/lib/copy/addresses";

export const metadata: Metadata = {
  title: addressesCopy.newTitle,
  robots: { index: false },
};

export default async function NewAddressPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=%2Faccount%2Faddresses%2Fnew");

  const addresses = await getAddressesForUser(session.user.id);
  if (addresses.length >= MAX_ADDRESSES_PER_USER) redirect("/account/addresses");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl">{addressesCopy.newTitle}</h1>
      <div className="mt-8">
        <AddressForm />
      </div>
    </div>
  );
}
