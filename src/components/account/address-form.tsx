"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { inputClass, textareaClass } from "@/components/ui/form";
import { saveAddressAction, type AddressFormState } from "@/lib/actions/addresses";
import type { SavedAddress } from "@/lib/addresses";
import { addressesCopy } from "@/lib/copy/addresses";
import { textLinkClass } from "@/components/ui/link";

const initialState: AddressFormState = { error: null };

export function AddressForm({ address }: { address?: SavedAddress }) {
  const [state, formAction, isPending] = useActionState(saveAddressAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {address && <input type="hidden" name="addressId" value={address.id} />}
      <label className="block text-sm font-medium">
        {addressesCopy.titleLabel}
        <input
          name="title"
          required
          defaultValue={address?.title}
          placeholder={addressesCopy.titlePlaceholder}
          className={inputClass}
        />
      </label>
      <label className="block text-sm font-medium">
        {addressesCopy.fullNameLabel}
        <input
          name="fullName"
          autoComplete="name"
          required
          defaultValue={address?.fullName}
          className={inputClass}
        />
      </label>
      <label className="block text-sm font-medium">
        {addressesCopy.phoneLabel}
        <input
          name="phone"
          type="tel"
          autoComplete="tel"
          required
          defaultValue={address?.phone}
          className={inputClass}
        />
      </label>
      <label className="block text-sm font-medium">
        {addressesCopy.addressLabel}
        <textarea
          name="address"
          rows={3}
          autoComplete="street-address"
          required
          defaultValue={address?.address}
          className={textareaClass}
        />
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="block text-sm font-medium">
          {addressesCopy.cityLabel}
          <input
            name="city"
            autoComplete="address-level1"
            required
            defaultValue={address?.city}
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium">
          {addressesCopy.districtLabel}
          <input
            name="district"
            autoComplete="address-level2"
            required
            defaultValue={address?.district}
            className={inputClass}
          />
        </label>
      </div>
      <label className="block text-sm font-medium">
        {addressesCopy.postalCodeLabel}
        <input
          name="postalCode"
          autoComplete="postal-code"
          defaultValue={address?.postalCode ?? ""}
          className={inputClass}
        />
      </label>

      {state.error && (
        <p role="alert" className="text-muted text-sm">
          {state.error}
        </p>
      )}
      <div className="mt-2 flex items-center gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? addressesCopy.saving : addressesCopy.save}
        </Button>
        <Link href="/account/addresses" className={textLinkClass}>
          {addressesCopy.cancel}
        </Link>
      </div>
    </form>
  );
}
