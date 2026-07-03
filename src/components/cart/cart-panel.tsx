"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Minus, Plus } from "lucide-react";
import { useCartUI } from "@/components/cart/cart-ui";
import { Price } from "@/components/product/price";
import { ProductImage } from "@/components/product/product-image";
import { ButtonLink } from "@/components/ui/button";
import { removeCartItem, updateCartItemQuantity, type CartActionResult } from "@/lib/actions/cart";
import { cartCopy } from "@/lib/copy/cart";
import { formatKurus } from "@/lib/money";
import type { CartLineView, CartView } from "@/lib/queries/cart";

export type CartPanelVariant = "drawer" | "page";

const stepperButtonClass =
  "border-border bg-surface hover:bg-background inline-flex size-11 items-center justify-center rounded-md border disabled:cursor-not-allowed disabled:opacity-40";

function CartLine({ line, closeOnNavigate }: { line: CartLineView; closeOnNavigate: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function mutate(action: () => Promise<CartActionResult>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error);
    });
  }

  const outOfStock = line.stock === 0;
  const atStockCap = line.quantity >= line.stock;

  return (
    <li className={`flex gap-3 py-4 ${isPending ? "opacity-60" : ""}`}>
      <Link
        href={`/p/${line.productSlug}`}
        onClick={closeOnNavigate}
        tabIndex={-1}
        aria-hidden
        className="border-border relative block aspect-4/5 w-16 shrink-0 overflow-hidden rounded-md border"
      >
        <ProductImage imageKey={line.imageKey} alt="" sizes="64px" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <Link
            href={`/p/${line.productSlug}`}
            onClick={closeOnNavigate}
            className="hover:text-muted truncate text-sm font-medium"
          >
            {line.productName}
          </Link>
          <span className="text-sm font-semibold whitespace-nowrap">
            {formatKurus(line.lineCents)}
          </span>
        </div>
        {line.variantLabel && <p className="text-muted mt-0.5 text-sm">{line.variantLabel}</p>}
        <Price
          priceCents={line.unitCents}
          originalCents={line.unitOriginalCents}
          onSale={line.onSale}
          className="mt-0.5 text-sm"
        />
        <div className="mt-2 flex items-center gap-2">
          {!outOfStock && (
            <>
              <button
                type="button"
                aria-label={cartCopy.decreaseFor(line.productName)}
                disabled={isPending || line.quantity <= 1}
                onClick={() =>
                  mutate(() =>
                    updateCartItemQuantity({ itemId: line.itemId, quantity: line.quantity - 1 }),
                  )
                }
                className={stepperButtonClass}
              >
                <Minus aria-hidden className="size-4" />
              </button>
              <span aria-live="polite" className="min-w-6 text-center text-sm font-medium">
                <span className="sr-only">{cartCopy.quantity(line.quantity)}</span>
                <span aria-hidden>{line.quantity}</span>
              </span>
              <button
                type="button"
                aria-label={cartCopy.increaseFor(line.productName)}
                disabled={isPending || atStockCap}
                onClick={() =>
                  mutate(() =>
                    updateCartItemQuantity({ itemId: line.itemId, quantity: line.quantity + 1 }),
                  )
                }
                className={stepperButtonClass}
              >
                <Plus aria-hidden className="size-4" />
              </button>
            </>
          )}
          <button
            type="button"
            disabled={isPending}
            aria-label={cartCopy.removeFor(line.productName)}
            onClick={() => mutate(() => removeCartItem({ itemId: line.itemId }))}
            className="text-muted hover:text-ink ml-auto inline-flex h-11 items-center px-2 text-sm underline underline-offset-4 disabled:opacity-40"
          >
            {cartCopy.remove}
          </button>
        </div>
        {outOfStock ? (
          <p className="text-muted mt-1 text-xs">{cartCopy.lineOutOfStock}</p>
        ) : (
          atStockCap && (
            <p className="text-muted mt-1 text-xs">{cartCopy.maxStockNote(line.stock)}</p>
          )
        )}
        {error && (
          <p role="alert" className="text-muted mt-1 text-xs">
            {error}
          </p>
        )}
      </div>
    </li>
  );
}

export function CartPanel({
  cart,
  freeShippingThresholdCents,
  variant,
}: {
  cart: CartView;
  freeShippingThresholdCents: number | null;
  variant: CartPanelVariant;
}) {
  const { setOpen } = useCartUI();
  const closeOnNavigate = () => setOpen(false);

  if (cart.lines.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
        <p className="text-muted">{cartCopy.empty}</p>
        <ButtonLink href="/products" onClick={closeOnNavigate}>
          {cartCopy.emptyCta}
        </ButtonLink>
      </div>
    );
  }

  const remainingToFreeShipping =
    freeShippingThresholdCents === null ? null : freeShippingThresholdCents - cart.subtotalCents;

  return (
    <div className="flex flex-1 flex-col">
      <ul className="divide-border flex-1 divide-y">
        {cart.lines.map((line) => (
          <CartLine key={line.itemId} line={line} closeOnNavigate={closeOnNavigate} />
        ))}
      </ul>
      <div className="border-border mt-auto border-t pt-4">
        <div className="flex items-baseline justify-between" aria-live="polite">
          <span className="text-sm font-medium">{cartCopy.subtotal}</span>
          <span className="text-lg font-semibold">{formatKurus(cart.subtotalCents)}</span>
        </div>
        {remainingToFreeShipping !== null && (
          <p className="text-muted mt-1 text-sm">
            {remainingToFreeShipping > 0
              ? cartCopy.freeShippingRemaining(remainingToFreeShipping)
              : cartCopy.freeShippingReached}
          </p>
        )}
        <p className="text-muted mt-1 text-xs">{cartCopy.shippingNote}</p>
        {variant === "drawer" ? (
          <ButtonLink href="/cart" size="lg" onClick={closeOnNavigate} className="mt-4 w-full">
            {cartCopy.viewCart}
          </ButtonLink>
        ) : (
          <ButtonLink href="/checkout" size="lg" className="mt-4 w-full sm:w-auto">
            {cartCopy.checkout}
          </ButtonLink>
        )}
      </div>
    </div>
  );
}
