import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DeleteAddressButton } from "@/components/account/delete-address-button";
import { ButtonLink } from "@/components/ui/button";
import { setDefaultAddressAction } from "@/lib/actions/addresses";
import { getAddressesForUser } from "@/lib/address-book";
import { MAX_ADDRESSES_PER_USER } from "@/lib/addresses";
import { auth } from "@/lib/auth";
import { addressesCopy } from "@/lib/copy/addresses";
import { textLinkClass } from "@/components/ui/link";

export const metadata: Metadata = {
  title: addressesCopy.listTitle,
  robots: { index: false },
};

export default async function AddressesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=%2Faccount%2Faddresses");

  const addresses = await getAddressesForUser(session.user.id);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl">{addressesCopy.listTitle}</h1>
      <p className="text-muted mt-2">{addressesCopy.listLead}</p>

      {addresses.length === 0 ? (
        <div className="border-border mt-8 rounded-lg border p-6">
          <p className="text-muted text-sm">{addressesCopy.empty}</p>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {addresses.map((address) => (
            <li key={address.id} className="border-border rounded-lg border p-6">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-medium">{address.title}</h2>
                {address.isDefault && (
                  <span className="bg-surface border-border rounded-full border px-3 py-1 text-xs">
                    {addressesCopy.defaultBadge}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm">
                {address.fullName} · {address.phone}
              </p>
              <p className="text-muted mt-1 text-sm whitespace-pre-line">{address.address}</p>
              <p className="text-muted text-sm">
                {address.district} / {address.city}
                {address.postalCode ? ` · ${address.postalCode}` : ""}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-5">
                <Link href={`/account/addresses/${address.id}/edit`} className={textLinkClass}>
                  {addressesCopy.edit}
                </Link>
                {!address.isDefault && (
                  <form action={setDefaultAddressAction}>
                    <input type="hidden" name="addressId" value={address.id} />
                    <button type="submit" className={textLinkClass}>
                      {addressesCopy.makeDefault}
                    </button>
                  </form>
                )}
                <DeleteAddressButton addressId={address.id} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-5">
        {addresses.length < MAX_ADDRESSES_PER_USER && (
          <ButtonLink href="/account/addresses/new">{addressesCopy.addCta}</ButtonLink>
        )}
        <Link href="/account" className={textLinkClass}>
          {addressesCopy.backToAccount}
        </Link>
      </div>
    </div>
  );
}
