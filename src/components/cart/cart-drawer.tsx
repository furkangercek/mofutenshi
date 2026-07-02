"use client";

import { X } from "lucide-react";
import { Dialog } from "radix-ui";
import { useCartUI } from "@/components/cart/cart-ui";
import { cartCopy } from "@/lib/copy/cart";

// Slide-over shell; the cart contents are server-rendered and passed in as
// children so mutations + refresh() re-render them without client fetching.
export function CartDrawer({ children }: { children: React.ReactNode }) {
  const { open, setOpen } = useCartUI();

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-ink/40 data-[state=closed]:animate-overlay-out data-[state=open]:animate-overlay-in fixed inset-0 z-50" />
        <Dialog.Content className="bg-surface data-[state=closed]:animate-drawer-out-right data-[state=open]:animate-drawer-in-right fixed inset-y-0 right-0 z-50 flex w-96 max-w-[92vw] flex-col shadow-lg">
          <div className="border-border flex items-center justify-between border-b px-4 py-3">
            <Dialog.Title className="font-display text-lg">{cartCopy.title}</Dialog.Title>
            <Dialog.Description className="sr-only">
              {cartCopy.drawerDescription}
            </Dialog.Description>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={cartCopy.close}
                className="text-ink hover:bg-background inline-flex size-11 items-center justify-center rounded-md"
              >
                <X aria-hidden className="size-5" />
              </button>
            </Dialog.Close>
          </div>
          <div className="flex flex-1 flex-col overflow-y-auto p-4">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
