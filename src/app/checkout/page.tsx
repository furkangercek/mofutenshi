import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { OrderSummary } from "@/components/checkout/order-summary";
import { ButtonLink } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { loadCheckoutCart } from "@/lib/checkout";
import { checkoutCopy } from "@/lib/copy/checkout";
import { getCardGateway } from "@/lib/payments";

export const metadata: Metadata = {
  title: checkoutCopy.title,
  robots: { index: false },
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const paymentFailed = params.error === "payment";

  const result = await loadCheckoutCart();
  if (!result.ok) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-display text-3xl">{checkoutCopy.emptyTitle}</h1>
        <p className="text-muted mt-2">
          {result.reason === "changed" ? checkoutCopy.cartChanged : checkoutCopy.emptyBody}
        </p>
        <div className="mt-6">
          <ButtonLink href={result.reason === "changed" ? "/cart" : "/products"}>
            {result.reason === "changed" ? checkoutCopy.backToCart : checkoutCopy.emptyCta}
          </ButtonLink>
        </div>
      </div>
    );
  }

  const session = await auth();
  const { cart } = result;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl">{checkoutCopy.title}</h1>
      {paymentFailed && (
        <p role="alert" className="border-border bg-surface mt-4 rounded-md border p-4 text-sm">
          {checkoutCopy.paymentFailed}
        </p>
      )}
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_24rem]">
        <CheckoutForm
          prefillName={session?.user?.name ?? undefined}
          prefillEmail={session?.user?.email ?? undefined}
          cardEnabled={getCardGateway() !== null}
          manualEnabled={cart.settings.manualPaymentEnabled}
        />
        <div className="lg:order-last">
          <OrderSummary
            lines={cart.lines.map((line) => ({
              key: line.variantId,
              name: line.productName,
              label: line.variantLabel,
              quantity: line.quantity,
              lineCents: line.lineCents,
            }))}
            subtotalCents={cart.subtotalCents}
            discountCents={cart.discountCents}
            shippingCents={cart.shippingCents}
            totalCents={cart.totalCents}
          />
        </div>
      </div>
    </div>
  );
}
