import type { Metadata } from "next";
import { Suspense } from "react";
import { CartContents } from "@/components/cart/cart-contents";
import { CartSkeleton } from "@/components/cart/cart-skeleton";
import { cartCopy } from "@/lib/copy/cart";

export const metadata: Metadata = {
  title: cartCopy.title,
  robots: { index: false },
};

export default function CartPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl">{cartCopy.title}</h1>
      <div className="mt-6 flex flex-col">
        <Suspense fallback={<CartSkeleton />}>
          <CartContents variant="page" />
        </Suspense>
      </div>
    </div>
  );
}
