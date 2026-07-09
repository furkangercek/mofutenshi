"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { inputClass, textareaClass } from "@/components/ui/form";
import { LoaderOverlay } from "@/components/ui/loader";
import { placeOrder, type CheckoutFormState } from "@/lib/actions/checkout";
import { NEW_ADDRESS_OPTION, type SavedAddress } from "@/lib/addresses";
import { checkoutCopy } from "@/lib/copy/checkout";

const initialState: CheckoutFormState = { error: null };

export function CheckoutForm({
  prefillName,
  prefillEmail,
  cardEnabled,
  manualEnabled,
  savedAddresses = [],
  canSaveAddress = false,
}: {
  prefillName?: string;
  prefillEmail?: string;
  cardEnabled: boolean;
  manualEnabled: boolean;
  savedAddresses?: SavedAddress[];
  canSaveAddress?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(placeOrder, initialState);
  const noMethod = !cardEnabled && !manualEnabled;

  // R19: saved addresses only prefill the fields below — the submitted form
  // fields stay the single source the server validates.
  const [selectedId, setSelectedId] = useState(
    savedAddresses.find((address) => address.isDefault)?.id ??
      savedAddresses[0]?.id ??
      NEW_ADDRESS_OPTION,
  );
  const selected = savedAddresses.find((address) => address.id === selectedId);

  return (
    <form action={formAction} className="relative flex flex-col gap-6">
      {isPending && <LoaderOverlay label={checkoutCopy.submitting} />}
      <section aria-labelledby="contact-heading" className="flex flex-col gap-4">
        <h2 id="contact-heading" className="font-display text-xl">
          {checkoutCopy.contactHeading}
        </h2>
        <label className="block text-sm font-medium">
          {checkoutCopy.fullNameLabel}
          <input
            key={selectedId}
            name="fullName"
            autoComplete="name"
            required
            defaultValue={selected ? selected.fullName : prefillName}
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium">
          {checkoutCopy.emailLabel}
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={prefillEmail}
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium">
          {checkoutCopy.phoneLabel}
          <input
            key={selectedId}
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            defaultValue={selected?.phone}
            className={inputClass}
          />
        </label>
      </section>

      <section aria-labelledby="shipping-heading" className="flex flex-col gap-4">
        <h2 id="shipping-heading" className="font-display text-xl">
          {checkoutCopy.shippingHeading}
        </h2>
        {savedAddresses.length > 0 && (
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 text-sm font-medium">
              {checkoutCopy.savedAddressesLegend}
            </legend>
            {savedAddresses.map((address) => (
              <label
                key={address.id}
                className="border-border bg-surface has-checked:border-ring flex items-start gap-3 rounded-md border p-4"
              >
                <input
                  type="radio"
                  name="savedAddressChoice"
                  value={address.id}
                  checked={selectedId === address.id}
                  onChange={() => setSelectedId(address.id)}
                  className="accent-ring mt-1"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{address.title}</span>
                  <span className="text-muted block text-sm">
                    {address.fullName} · {address.district} / {address.city}
                  </span>
                </span>
              </label>
            ))}
            <label className="border-border bg-surface has-checked:border-ring flex items-start gap-3 rounded-md border p-4">
              <input
                type="radio"
                name="savedAddressChoice"
                value={NEW_ADDRESS_OPTION}
                checked={selectedId === NEW_ADDRESS_OPTION}
                onChange={() => setSelectedId(NEW_ADDRESS_OPTION)}
                className="accent-ring mt-1"
              />
              <span className="text-sm font-medium">{checkoutCopy.newAddressOption}</span>
            </label>
          </fieldset>
        )}
        <label className="block text-sm font-medium">
          {checkoutCopy.addressLabel}
          <textarea
            key={selectedId}
            name="address"
            rows={3}
            autoComplete="street-address"
            required
            defaultValue={selected?.address}
            className={textareaClass}
          />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm font-medium">
            {checkoutCopy.cityLabel}
            <input
              key={selectedId}
              name="city"
              autoComplete="address-level1"
              required
              defaultValue={selected?.city}
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-medium">
            {checkoutCopy.districtLabel}
            <input
              key={selectedId}
              name="district"
              autoComplete="address-level2"
              required
              defaultValue={selected?.district}
              className={inputClass}
            />
          </label>
        </div>
        <label className="block text-sm font-medium">
          {checkoutCopy.postalCodeLabel}
          <input
            key={selectedId}
            name="postalCode"
            autoComplete="postal-code"
            defaultValue={selected?.postalCode ?? ""}
            className={inputClass}
          />
        </label>
        {canSaveAddress && selectedId === NEW_ADDRESS_OPTION && (
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="saveAddress" className="accent-ring mt-1" />
            <span>{checkoutCopy.saveAddressLabel}</span>
          </label>
        )}
        <label className="block text-sm font-medium">
          {checkoutCopy.notesLabel}
          <textarea name="notes" rows={2} className={textareaClass} />
        </label>
      </section>

      <fieldset className="flex flex-col gap-3">
        <legend className="font-display mb-3 text-xl">{checkoutCopy.paymentHeading}</legend>
        {noMethod && <p className="text-muted text-sm">{checkoutCopy.noPaymentMethod}</p>}
        {cardEnabled && (
          <label className="border-border bg-surface has-checked:border-ring flex items-start gap-3 rounded-md border p-4">
            <input
              type="radio"
              name="paymentMethod"
              value="card"
              defaultChecked
              className="accent-ring mt-1"
            />
            <span>
              <span className="block text-sm font-medium">{checkoutCopy.payWithCard}</span>
              <span className="text-muted block text-sm">{checkoutCopy.payWithCardHint}</span>
            </span>
          </label>
        )}
        {manualEnabled && (
          <label className="border-border bg-surface has-checked:border-ring flex items-start gap-3 rounded-md border p-4">
            <input
              type="radio"
              name="paymentMethod"
              value="manual"
              defaultChecked={!cardEnabled}
              className="accent-ring mt-1"
            />
            <span>
              <span className="block text-sm font-medium">{checkoutCopy.payManual}</span>
              <span className="text-muted block text-sm">{checkoutCopy.payManualHint}</span>
            </span>
          </label>
        )}
      </fieldset>

      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="legalConsent" required className="accent-ring mt-1" />
        <span>
          <a
            href="/legal/on-bilgilendirme"
            target="_blank"
            rel="noopener"
            className="underline underline-offset-2"
          >
            {checkoutCopy.consentPreInfo}
          </a>
          {checkoutCopy.consentMiddle}
          <a
            href="/legal/mesafeli-satis-sozlesmesi"
            target="_blank"
            rel="noopener"
            className="underline underline-offset-2"
          >
            {checkoutCopy.consentContract}
          </a>
          {checkoutCopy.consentSuffix}
        </span>
      </label>

      {state.error && (
        <p role="alert" className="text-muted text-sm">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={isPending || noMethod}>
        {isPending ? checkoutCopy.submitting : checkoutCopy.submit}
      </Button>
    </form>
  );
}
