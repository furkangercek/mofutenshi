"use client";

import { useActionState } from "react";
import { ButtonSecondary } from "@/components/ui/button";
import { inputClass } from "@/components/ui/form";
import { textLinkClass } from "@/components/ui/link";
import { applyCouponAction, removeCouponAction, type CouponFormState } from "@/lib/actions/coupons";
import { couponCopy } from "@/lib/copy/coupons";
import { formatKurus } from "@/lib/money";

const initialState: CouponFormState = { error: null };

export function CouponBox({
  applied,
  loadError,
}: {
  applied: { code: string; percentOff: number; discountCents: number } | null;
  loadError: string | null;
}) {
  const [state, formAction, isPending] = useActionState(applyCouponAction, initialState);

  if (applied) {
    return (
      <div className="border-border mt-4 rounded-lg border p-4">
        <p className="text-sm font-medium">{couponCopy.heading}</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span>
            {couponCopy.appliedLabel(applied.code, applied.percentOff)}
            <span className="text-muted"> · −{formatKurus(applied.discountCents)}</span>
          </span>
          <form action={removeCouponAction}>
            <button type="submit" className={textLinkClass}>
              {couponCopy.remove}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="border-border mt-4 rounded-lg border p-4">
      <form action={formAction}>
        <label className="block text-sm font-medium">
          {couponCopy.heading}
          <span className="mt-1 flex gap-2">
            <input
              name="code"
              autoComplete="off"
              aria-label={couponCopy.inputLabel}
              className={`${inputClass} mt-0 uppercase`}
            />
            <ButtonSecondary type="submit" disabled={isPending} className="shrink-0 text-sm">
              {isPending ? couponCopy.applying : couponCopy.apply}
            </ButtonSecondary>
          </span>
        </label>
        {(state.error ?? loadError) && (
          <p role="alert" className="text-muted mt-2 text-sm">
            {state.error ?? loadError}
          </p>
        )}
      </form>
      {loadError && (
        <form action={removeCouponAction} className="mt-1">
          <button type="submit" className={textLinkClass}>
            {couponCopy.remove}
          </button>
        </form>
      )}
    </div>
  );
}
