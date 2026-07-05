"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { inputClass, textareaClass } from "@/components/ui/form";
import { placeOrder, type CheckoutFormState } from "@/lib/actions/checkout";
import { checkoutCopy } from "@/lib/copy/checkout";

const initialState: CheckoutFormState = { error: null };

export function CheckoutForm({
  prefillName,
  prefillEmail,
  cardEnabled,
  manualEnabled,
}: {
  prefillName?: string;
  prefillEmail?: string;
  cardEnabled: boolean;
  manualEnabled: boolean;
}) {
  const [state, formAction, isPending] = useActionState(placeOrder, initialState);
  const noMethod = !cardEnabled && !manualEnabled;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <section aria-labelledby="contact-heading" className="flex flex-col gap-4">
        <h2 id="contact-heading" className="font-display text-xl">
          {checkoutCopy.contactHeading}
        </h2>
        <label className="block text-sm font-medium">
          {checkoutCopy.fullNameLabel}
          <input
            name="fullName"
            autoComplete="name"
            required
            defaultValue={prefillName}
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
          <input name="phone" type="tel" autoComplete="tel" required className={inputClass} />
        </label>
      </section>

      <section aria-labelledby="shipping-heading" className="flex flex-col gap-4">
        <h2 id="shipping-heading" className="font-display text-xl">
          {checkoutCopy.shippingHeading}
        </h2>
        <label className="block text-sm font-medium">
          {checkoutCopy.addressLabel}
          <textarea
            name="address"
            rows={3}
            autoComplete="street-address"
            required
            className={textareaClass}
          />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm font-medium">
            {checkoutCopy.cityLabel}
            <input name="city" autoComplete="address-level1" required className={inputClass} />
          </label>
          <label className="block text-sm font-medium">
            {checkoutCopy.districtLabel}
            <input name="district" autoComplete="address-level2" required className={inputClass} />
          </label>
        </div>
        <label className="block text-sm font-medium">
          {checkoutCopy.postalCodeLabel}
          <input name="postalCode" autoComplete="postal-code" className={inputClass} />
        </label>
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
