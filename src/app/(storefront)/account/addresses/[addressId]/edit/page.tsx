import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AddressForm } from "@/components/account/address-form";
import { getAddressForUser } from "@/lib/address-book";
import { auth } from "@/lib/auth";
import { addressesCopy } from "@/lib/copy/addresses";

export const metadata: Metadata = {
  title: addressesCopy.editTitle,
  robots: { index: false },
};

export default async function EditAddressPage({
  params,
}: {
  params: Promise<{ addressId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=%2Faccount%2Faddresses");

  const { addressId } = await params;
  const address = await getAddressForUser(session.user.id, addressId);
  if (!address) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl">{addressesCopy.editTitle}</h1>
      <div className="mt-8">
        <AddressForm address={address} />
      </div>
    </div>
  );
}
