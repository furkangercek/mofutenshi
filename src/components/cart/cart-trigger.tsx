"use client";

import { ShoppingBag } from "lucide-react";
import { useCartUI } from "@/components/cart/cart-ui";
import { cartCopy } from "@/lib/copy/cart";

export function CartTriggerButton({ count }: { count: number }) {
  const { setOpen } = useCartUI();

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={count > 0 ? `${cartCopy.open}, ${cartCopy.itemCountBadge(count)}` : cartCopy.open}
      className="text-ink hover:bg-background relative inline-flex size-11 items-center justify-center rounded-md"
    >
      <ShoppingBag aria-hidden className="size-5" />
      {count > 0 && (
        <span
          aria-hidden
          className="bg-ring absolute top-1 right-1 inline-flex size-4.5 items-center justify-center rounded-full text-[10px] font-semibold text-white"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
