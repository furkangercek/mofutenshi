import type { Metadata } from "next";
import { OrderSummary } from "@/components/checkout/order-summary";
import { ButtonLink } from "@/components/ui/button";
import { accountOrdersCopy, confirmationCopy } from "@/lib/copy/checkout";
import { verifyOrderAccessToken } from "@/lib/order-token";
import { prisma } from "@/lib/prisma";
import { getConfirmationOrder } from "@/lib/queries/orders";

export const metadata: Metadata = {
  title: confirmationCopy.title,
  robots: { index: false },
};

function InvalidLink() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6">
      <h1 className="font-display text-3xl">{confirmationCopy.notFoundTitle}</h1>
      <p className="text-muted mt-2">{confirmationCopy.notFoundBody}</p>
      <div className="mt-6">
        <ButtonLink href="/">{confirmationCopy.continueShopping}</ButtonLink>
      </div>
    </div>
  );
}

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const orderId = typeof params.order === "string" ? params.order : null;
  const token = typeof params.token === "string" ? params.token : null;
  if (!orderId || !token || !verifyOrderAccessToken(orderId, token)) return <InvalidLink />;

  const order = await getConfirmationOrder(orderId);
  if (!order) return <InvalidLink />;

  const isManualPending = order.status === "PENDING_PAYMENT" && order.paymentProvider === "manual";
  const manualInstructions = isManualPending
    ? ((
        await prisma.setting.findUnique({
          where: { id: 1 },
          select: { manualPaymentInstructions: true },
        })
      )?.manualPaymentInstructions ?? confirmationCopy.manualFallback)
    : null;

  const lead =
    order.status === "PAID"
      ? confirmationCopy.paidLead
      : isManualPending
        ? confirmationCopy.pendingLead
        : accountOrdersCopy.statusLabels[order.status];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl">{confirmationCopy.title}</h1>
      <p className="text-muted mt-2">{lead}</p>
      <p className="mt-4 text-sm">
        {confirmationCopy.orderNumberLabel}:{" "}
        <span className="font-semibold">{order.orderNumber}</span>
      </p>

      {manualInstructions && (
        <section className="border-border bg-surface mt-6 rounded-lg border p-6">
          <h2 className="font-display text-xl">{confirmationCopy.manualHeading}</h2>
          <p className="text-muted mt-2 text-sm whitespace-pre-line">{manualInstructions}</p>
        </section>
      )}

      <div className="mt-6">
        <OrderSummary
          lines={order.items.map((item) => ({
            key: item.id,
            name: item.name,
            label: item.label || null,
            quantity: item.quantity,
            lineCents: item.lineTotalCents,
          }))}
          subtotalCents={order.subtotalCents}
          discountCents={order.discountCents}
          couponCode={order.couponCode}
          couponDiscountCents={order.couponDiscountCents}
          shippingCents={order.shippingCents}
          totalCents={order.totalCents}
        />
      </div>

      <div className="mt-8">
        <ButtonLink href="/products">{confirmationCopy.continueShopping}</ButtonLink>
      </div>
    </div>
  );
}
