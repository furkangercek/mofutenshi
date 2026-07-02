import { CartSkeleton } from "@/components/cart/cart-skeleton";

export default function CartLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <div aria-hidden className="bg-ghost h-9 w-40 animate-pulse rounded" />
      <div className="mt-6">
        <CartSkeleton />
      </div>
    </div>
  );
}
