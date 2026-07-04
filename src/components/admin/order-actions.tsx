"use client";

import { useActionState } from "react";
import { Button, ButtonSecondary } from "@/components/ui/button";
import type { AdminFormState } from "@/lib/actions/admin-settings";
import { cancelOrderAction, confirmOrderPaidAction } from "@/lib/actions/admin-orders";
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
