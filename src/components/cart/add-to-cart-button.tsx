"use client";

import { useState, useTransition } from "react";
import { useCartUI } from "@/components/cart/cart-ui";
import { Button } from "@/components/ui/button";
import { addCartItem } from "@/lib/actions/cart";
import { cartCopy } from "@/lib/copy/cart";
import { productCopy } from "@/lib/copy/catalog";

export function AddToCartButton({
  variantId,
  disabled,
}: {
  variantId: string | undefined;
  disabled: boolean;
}) {
  const { setOpen } = useCartUI();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!variantId) return;
    setError(null);
    startTransition(async () => {
      const result = await addCartItem({ variantId, quantity: 1 });
      // The drawer opening IS the confirmation (PRD US-07).
      if (result.ok) setOpen(true);
      else setError(result.error);
    });
  }

  return (
    <div>
      <Button size="lg" disabled={disabled || isPending} onClick={handleClick}>
        {isPending ? cartCopy.adding : productCopy.addToCart}
      </Button>
      {error && (
        <p role="alert" className="text-muted mt-2 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
