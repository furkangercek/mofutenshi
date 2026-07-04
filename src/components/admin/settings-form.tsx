"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { inputClass, textareaClass } from "@/components/ui/form";
import { saveSettings, type AdminFormState } from "@/lib/actions/admin-settings";
import { adminCopy, adminSettingsCopy } from "@/lib/copy/admin";

const initialState: AdminFormState = { error: null, saved: false };

export type SettingsFormValues = {
  flatShipping: string;
  freeShippingThreshold: string;
  lowStockThreshold: number;
  manualPaymentEnabled: boolean;
  manualPaymentInstructions: string;
};

export function SettingsForm({ defaults }: { defaults: SettingsFormValues }) {
  const [state, formAction, isPending] = useActionState(saveSettings, initialState);

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-8">
      <section aria-labelledby="shipping-settings" className="flex flex-col gap-4">
        <h2 id="shipping-settings" className="font-display text-xl">
          {adminSettingsCopy.shippingHeading}
        </h2>
        <label className="block text-sm font-medium">
          {adminSettingsCopy.flatShippingLabel}
          <input
            name="flatShipping"
            inputMode="decimal"
            required
            defaultValue={defaults.flatShipping}
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium">
          {adminSettingsCopy.freeThresholdLabel}
          <input
            name="freeShippingThreshold"
            inputMode="decimal"
            required
            defaultValue={defaults.freeShippingThreshold}
            className={inputClass}
          />
          <span className="text-muted mt-1 block text-xs font-normal">
            {adminSettingsCopy.freeThresholdHint}
          </span>
        </label>
      </section>

      <section aria-labelledby="inventory-settings" className="flex flex-col gap-4">
        <h2 id="inventory-settings" className="font-display text-xl">
          {adminSettingsCopy.inventoryHeading}
        </h2>
        <label className="block text-sm font-medium">
          {adminSettingsCopy.lowStockLabel}
          <input
            name="lowStockThreshold"
            type="number"
            min={0}
            max={10000}
            required
            defaultValue={defaults.lowStockThreshold}
            className={inputClass}
          />
          <span className="text-muted mt-1 block text-xs font-normal">
            {adminSettingsCopy.lowStockHint}
          </span>
        </label>
      </section>

      <section aria-labelledby="payment-settings" className="flex flex-col gap-4">
        <h2 id="payment-settings" className="font-display text-xl">
          {adminSettingsCopy.paymentHeading}
        </h2>
        <label className="flex items-center gap-3 text-sm font-medium">
          <input
            name="manualPaymentEnabled"
            type="checkbox"
            defaultChecked={defaults.manualPaymentEnabled}
            className="accent-ring size-4"
          />
          {adminSettingsCopy.manualEnabledLabel}
        </label>
        <label className="block text-sm font-medium">
          {adminSettingsCopy.manualInstructionsLabel}
          <textarea
            name="manualPaymentInstructions"
            rows={4}
            defaultValue={defaults.manualPaymentInstructions}
            className={textareaClass}
          />
          <span className="text-muted mt-1 block text-xs font-normal">
            {adminSettingsCopy.manualInstructionsHint}
          </span>
        </label>
      </section>

      {state.error && (
        <p role="alert" className="text-muted text-sm">
          {state.error}
        </p>
      )}
      {state.saved && !state.error && (
        <p role="status" className="text-sm font-medium">
          {adminCopy.common.saved}
        </p>
      )}
      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? adminCopy.common.saving : adminCopy.common.save}
        </Button>
      </div>
    </form>
  );
}
