import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderActions } from "@/components/admin/order-actions";
import { requireAdmin } from "@/lib/admin-guard";
import { adminOrdersCopy } from "@/lib/copy/admin";
import { accountOrdersCopy } from "@/lib/copy/checkout";
import { formatKurus } from "@/lib/money";
import { getAdminOrder } from "@/lib/queries/admin";

export const metadata: Metadata = { title: adminOrdersCopy.title };

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "long",
  timeStyle: "short",
});

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  await requireAdmin(`/admin/orders/${orderId}`);

  const order = await getAdminOrder(orderId);
  if (!order) notFound();

  const address = order.shippingAddress;
  const addressLine = [address.address, address.district, address.city, address.postalCode]
    .filter(Boolean)
    .join(", ");
  const provider = order.paymentProvider
    ? (adminOrdersCopy.providerNames[order.paymentProvider] ?? order.paymentProvider)
    : "—";

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl">{adminOrdersCopy.detailTitle(order.orderNumber)}</h1>
        <p className="text-muted mt-2 text-sm">
          {adminOrdersCopy.placedAtLabel}: {dateFormatter.format(order.placedAt)} ·{" "}
          {adminOrdersCopy.statusLabel}:{" "}
          <span className="text-ink font-medium">
            {accountOrdersCopy.statusLabels[order.status]}
          </span>
        </p>
      </div>

      {order.status === "PENDING_PAYMENT" ? (
        <section
          aria-label={adminOrdersCopy.paymentHeading}
          className="border-border bg-surface rounded-lg border p-6"
        >
          <OrderActions id={order.id} orderNumber={order.orderNumber} />
        </section>
      ) : null}

      <section className="border-border bg-surface rounded-lg border p-6">
        <h2 className="font-display text-xl">{adminOrdersCopy.itemsHeading}</h2>
        <ul className="divide-border mt-2 divide-y">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-baseline justify-between gap-3 py-3">
              <span className="min-w-0">
                <span className="block text-sm font-medium">{item.name}</span>
                <span className="text-muted block text-sm">
                  {item.label ? `${item.label} · ` : ""}
                  {item.quantity} × {formatKurus(item.unitPriceCents)}
                </span>
              </span>
              <span className="text-sm font-semibold whitespace-nowrap">
                {formatKurus(item.lineTotalCents)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="border-border mt-4 flex flex-col gap-1 border-t pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">{adminOrdersCopy.subtotal}</dt>
            <dd>{formatKurus(order.subtotalCents)}</dd>
          </div>
          {order.discountCents > 0 ? (
            <div className="flex justify-between">
              <dt className="text-muted">{adminOrdersCopy.discount}</dt>
              <dd>−{formatKurus(order.discountCents)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between">
            <dt className="text-muted">{adminOrdersCopy.shipping}</dt>
            <dd>
              {order.shippingCents === 0
                ? adminOrdersCopy.shippingFree
                : formatKurus(order.shippingCents)}
            </dd>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <dt>{adminOrdersCopy.total}</dt>
            <dd>{formatKurus(order.totalCents)}</dd>
          </div>
        </dl>
      </section>

      <section className="border-border bg-surface rounded-lg border p-6">
        <h2 className="font-display text-xl">{adminOrdersCopy.customerHeading}</h2>
        <dl className="mt-2 flex flex-col gap-1 text-sm">
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted">{adminOrdersCopy.emailLabel}</dt>
            <dd>{order.email}</dd>
          </div>
          {address.fullName ? (
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-muted">{adminOrdersCopy.nameLabel}</dt>
              <dd>{address.fullName}</dd>
            </div>
          ) : null}
          {address.phone ? (
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-muted">{adminOrdersCopy.phoneLabel}</dt>
              <dd>{address.phone}</dd>
            </div>
          ) : null}
          {addressLine ? (
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-muted">{adminOrdersCopy.addressLabel}</dt>
              <dd className="max-w-md text-right">{addressLine}</dd>
            </div>
          ) : null}
          {order.notes ? (
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-muted">{adminOrdersCopy.notesLabel}</dt>
              <dd className="max-w-md text-right whitespace-pre-line">{order.notes}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section className="border-border bg-surface rounded-lg border p-6">
        <h2 className="font-display text-xl">{adminOrdersCopy.paymentHeading}</h2>
        <dl className="mt-2 flex flex-col gap-1 text-sm">
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted">{adminOrdersCopy.providerLabel}</dt>
            <dd>{provider}</dd>
          </div>
          {order.paymentRef ? (
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-muted">{adminOrdersCopy.paymentRefLabel}</dt>
              <dd className="max-w-md truncate">{order.paymentRef}</dd>
            </div>
          ) : null}
        </dl>
      </section>
    </div>
  );
}
