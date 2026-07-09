"use client";

import { useActionState } from "react";
import { Button, ButtonSecondary } from "@/components/ui/button";
import { inputClass } from "@/components/ui/form";
import type { AdminFormState } from "@/lib/actions/admin-settings";
import { deleteCouponAction, saveCouponAction } from "@/lib/actions/admin-coupons";
import { adminCouponsCopy } from "@/lib/copy/coupons";

const initialState: AdminFormState = { error: null, saved: false };

export type CouponFormValues = {
  id?: string;
  code: string;
  percentOff: string;
  startsAt: string;
  endsAt: string;
  minSubtotal: string;
  maxRedemptions: string;
  isActive: boolean;
};

export function CouponForm({ defaults }: { defaults: CouponFormValues }) {
  const [state, formAction, isPending] = useActionState(saveCouponAction, initialState);
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteCouponAction, initialState);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <form action={formAction} className="flex flex-col gap-6">
        {defaults.id ? <input type="hidden" name="id" value={defaults.id} /> : null}

        <label className="block max-w-xs text-sm font-medium">
          {adminCouponsCopy.codeLabel}
          <input
            name="code"
            required
            autoComplete="off"
            defaultValue={defaults.code}
            className={`${inputClass} uppercase`}
          />
          <span className="text-muted mt-1 block text-xs font-normal">
            {adminCouponsCopy.codeHint}
          </span>
        </label>

        <label className="block max-w-xs text-sm font-medium">
          {adminCouponsCopy.percentLabel}
          <input
            name="percentOff"
            required
            inputMode="numeric"
            defaultValue={defaults.percentOff}
            className={inputClass}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            {adminCouponsCopy.startsAtLabel}
            <input
              name="startsAt"
              type="datetime-local"
              required
              defaultValue={defaults.startsAt}
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-medium">
            {adminCouponsCopy.endsAtLabel}
            <input
              name="endsAt"
              type="datetime-local"
              required
              defaultValue={defaults.endsAt}
              className={inputClass}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            {adminCouponsCopy.minSubtotalLabel}
            <input
              name="minSubtotal"
              inputMode="decimal"
              defaultValue={defaults.minSubtotal}
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-medium">
            {adminCouponsCopy.maxRedemptionsLabel}
            <input
              name="maxRedemptions"
              inputMode="numeric"
              defaultValue={defaults.maxRedemptions}
              className={inputClass}
            />
          </label>
        </div>

        <label className="flex items-center gap-3 text-sm font-medium">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={defaults.isActive}
            className="accent-ring"
          />
          {adminCouponsCopy.activeLabel}
        </label>

        {state.error && (
          <p role="alert" className="text-muted text-sm">
            {state.error}
          </p>
        )}
        <div>
          <Button type="submit" disabled={isPending}>
            {isPending ? adminCouponsCopy.saving : adminCouponsCopy.save}
          </Button>
        </div>
      </form>

      {defaults.id && (
        <form
          action={deleteAction}
          onSubmit={(event) => {
            if (!window.confirm(adminCouponsCopy.deleteConfirm(defaults.code)))
              event.preventDefault();
          }}
          className="border-border border-t pt-6"
        >
          <input type="hidden" name="id" value={defaults.id} />
          {deleteState.error && (
            <p role="alert" className="text-muted mb-3 text-sm">
              {deleteState.error}
            </p>
          )}
          <ButtonSecondary type="submit" disabled={isDeleting} className="text-sm">
            {adminCouponsCopy.delete}
          </ButtonSecondary>
        </form>
      )}
    </div>
  );
}
