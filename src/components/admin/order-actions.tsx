"use client";

import { useActionState } from "react";
import { Button, ButtonSecondary } from "@/components/ui/button";
import { inputClass } from "@/components/ui/form";
import type { AdminFormState } from "@/lib/actions/admin-settings";
import {
  cancelOrderAction,
  cancelPaidOrderAction,
  confirmOrderPaidAction,
  fulfillOrderAction,
} from "@/lib/actions/admin-orders";
import { adminOrdersCopy } from "@/lib/copy/admin";

const initialState: AdminFormState = { error: null, saved: false };

export function OrderActions({ id, orderNumber }: { id: string; orderNumber: string }) {
  const [confirmState, confirmAction, confirmPending] = useActionState(
    confirmOrderPaidAction,
    initialState,
  );
  const [cancelState, cancelAction, cancelPending] = useActionState(
    cancelOrderAction,
    initialState,
  );
  const busy = confirmPending || cancelPending;
  const error = confirmState.error ?? cancelState.error;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted text-sm">{adminOrdersCopy.confirmPaidHint}</p>
      <div className="flex flex-wrap gap-3">
        <form
          action={confirmAction}
          onSubmit={(event) => {
            if (!window.confirm(adminOrdersCopy.confirmPaidConfirm(orderNumber)))
              event.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={id} />
          <Button type="submit" disabled={busy}>
            {adminOrdersCopy.confirmPaidCta}
          </Button>
        </form>
        <form
          action={cancelAction}
          onSubmit={(event) => {
            if (!window.confirm(adminOrdersCopy.cancelConfirm(orderNumber))) event.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={id} />
          <ButtonSecondary type="submit" disabled={busy}>
            {adminOrdersCopy.cancelCta}
          </ButtonSecondary>
        </form>
      </div>
      {error && (
        <p role="alert" className="text-muted text-sm">
          {error}
        </p>
      )}
    </div>
  );
}

// Actions on a PAID order: mark shipped (R13, optional tracking fields) or
// cancel with restock (R14 — the refund itself stays manual).
export function FulfillActions({ id, orderNumber }: { id: string; orderNumber: string }) {
  const [fulfillState, fulfillAction, fulfillPending] = useActionState(
    fulfillOrderAction,
    initialState,
  );
  const [cancelState, cancelAction, cancelPending] = useActionState(
    cancelPaidOrderAction,
    initialState,
  );
  const busy = fulfillPending || cancelPending;
  const error = fulfillState.error ?? cancelState.error;

  return (
    <div className="flex flex-col gap-4">
      <form
        action={fulfillAction}
        onSubmit={(event) => {
          if (!window.confirm(adminOrdersCopy.fulfillConfirm(orderNumber))) event.preventDefault();
        }}
        className="flex flex-col gap-3"
      >
        <p className="text-muted text-sm">{adminOrdersCopy.fulfillHint}</p>
        <input type="hidden" name="id" value={id} />
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="block flex-1 text-sm font-medium">
            {adminOrdersCopy.carrierLabel}
            <input name="carrier" maxLength={100} className={inputClass} />
          </label>
          <label className="block flex-1 text-sm font-medium">
            {adminOrdersCopy.trackingNumberLabel}
            <input name="trackingNumber" maxLength={100} className={inputClass} />
          </label>
        </div>
        <div>
          <Button type="submit" disabled={busy}>
            {adminOrdersCopy.fulfillCta}
          </Button>
        </div>
      </form>
      <div className="border-border flex flex-col gap-3 border-t pt-4">
        <p className="text-muted text-sm">{adminOrdersCopy.cancelPaidHint}</p>
        <form
          action={cancelAction}
          onSubmit={(event) => {
            if (!window.confirm(adminOrdersCopy.cancelPaidConfirm(orderNumber)))
              event.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={id} />
          <ButtonSecondary type="submit" disabled={busy}>
            {adminOrdersCopy.cancelPaidCta}
          </ButtonSecondary>
        </form>
      </div>
      {error && (
        <p role="alert" className="text-muted text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
