"use client";

import { deleteAddressAction } from "@/lib/actions/addresses";
import { addressesCopy } from "@/lib/copy/addresses";
import { textLinkClass } from "@/components/ui/link";

// Native confirm matches the v1 admin pragmatism (see STATUS reminders);
// swap for Radix AlertDialog together with the admin dialogs if desired.
export function DeleteAddressButton({ addressId }: { addressId: string }) {
  return (
    <form
      action={deleteAddressAction}
      onSubmit={(event) => {
        if (!window.confirm(addressesCopy.removeConfirm)) event.preventDefault();
      }}
    >
      <input type="hidden" name="addressId" value={addressId} />
      <button type="submit" className={textLinkClass}>
        {addressesCopy.remove}
      </button>
    </form>
  );
}
