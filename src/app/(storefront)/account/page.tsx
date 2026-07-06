import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions/auth";
import { auth } from "@/lib/auth";
import { authCopy } from "@/lib/copy/auth";
import { accountOrdersCopy } from "@/lib/copy/checkout";
import { formatKurus } from "@/lib/money";
import { getOrdersForUser } from "@/lib/queries/orders";

const dateFormatter = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" });

export const metadata: Metadata = {
  title: authCopy.accountTitle,
  robots: { index: false },
};

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=%2Faccount");

  const displayName = session.user.name?.trim() || session.user.email || "";
  const orders = await getOrdersForUser(session.user.id);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl">{authCopy.accountTitle}</h1>
      <p className="text-muted mt-2">{authCopy.greeting(displayName)}</p>

      <section className="border-border mt-8 rounded-lg border p-6">
        <h2 className="font-display text-xl">{authCopy.ordersHeading}</h2>
        {orders.length === 0 ? (
          <>
            <p className="text-muted mt-2 text-sm">{authCopy.ordersEmpty}</p>
            <ButtonLink href="/products" className="mt-4">
              {authCopy.browseCta}
            </ButtonLink>
          </>
        ) : (
          <ul className="divide-border mt-2 divide-y">
            {orders.map((order) => (
              <li key={order.id} className="flex items-baseline justify-between gap-3 py-3">
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{order.orderNumber}</span>
                  <span className="text-muted block text-sm">
                    {dateFormatter.format(order.placedAt)} ·{" "}
                    {accountOrdersCopy.statusLabels[order.status]}
                  </span>
                  {order.status === "FULFILLED" && (order.carrier || order.trackingNumber) ? (
                    <span className="text-muted block text-sm">
                      {accountOrdersCopy.trackingLine(
                        order.carrier ?? "—",
                        order.trackingNumber ?? "—",
                      )}
                    </span>
                  ) : null}
                  {order.status === "PAID" || order.status === "FULFILLED" ? (
                    <a
                      href={`/api/orders/${order.id}/invoice`}
                      className="text-muted hover:text-ink inline-flex min-h-11 items-center text-sm underline underline-offset-4"
                    >
                      {accountOrdersCopy.invoiceLink}
                    </a>
                  ) : null}
                </span>
                <span className="text-sm font-semibold whitespace-nowrap">
                  {formatKurus(order.totalCents)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form action={logoutAction} className="mt-8">
        <button
          type="submit"
          className="border-border bg-surface hover:bg-background inline-flex h-11 items-center justify-center rounded-md border px-6 font-medium transition active:scale-[0.97]"
        >
          {authCopy.logout}
        </button>
      </form>
    </div>
  );
}
