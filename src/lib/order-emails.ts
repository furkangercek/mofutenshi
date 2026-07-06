import { createElement } from "react";
import {
  OrderPaidEmail,
  OrderReceivedEmail,
  OrderShippedEmail,
  type OrderEmailProps,
} from "@/components/emails/order-emails";
import { emailCopy } from "@/lib/copy/emails";
import { invoiceCopy } from "@/lib/copy/invoice";
import { emailEnabled, sendEmail, type EmailAttachment } from "@/lib/email";
import { generateInvoicePdf, loadInvoiceData } from "@/lib/invoice";
import { formatKurus } from "@/lib/money";
import { orderAccessToken } from "@/lib/order-token";
import type { ShippingAddress } from "@/lib/payments/types";
import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site";

// Order lifecycle emails, triggered via next/server after() so they never
// block or fail the checkout/payment response. markOrderPaid's guarded
// transition is the dedupe: callers only send when the flip actually happened,
// so gateway callback replays cannot double-send.

type LoadedOrder = {
  to: string;
  props: OrderEmailProps;
  paymentProvider: string | null;
  carrier: string | null;
  trackingNumber: string | null;
};

async function loadOrderEmail(orderId: string): Promise<LoadedOrder | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) {
    console.error(`order email skipped: order ${orderId} not found`);
    return null;
  }

  const address = order.shippingAddress as ShippingAddress;
  const cityLine = `${address.district}, ${address.city}${address.postalCode ? ` ${address.postalCode}` : ""}`;

  return {
    to: order.email,
    paymentProvider: order.paymentProvider,
    carrier: order.carrier,
    trackingNumber: order.trackingNumber,
    props: {
      orderNumber: order.orderNumber,
      greetingName: address.fullName,
      lines: order.items.map((item) => ({
        name: item.productNameSnapshot,
        variantLabel: item.variantLabelSnapshot,
        quantity: item.quantity,
        lineTotal: formatKurus(item.lineTotalCents),
      })),
      subtotal: formatKurus(order.subtotalCents),
      discount: order.discountCents > 0 ? `−${formatKurus(order.discountCents)}` : null,
      shipping:
        order.shippingCents === 0 ? emailCopy.shippingFree : formatKurus(order.shippingCents),
      total: formatKurus(order.totalCents),
      addressLines: [address.fullName, address.phone, address.address, cityLine],
      confirmationUrl: `${siteUrl}/checkout/confirmation?order=${order.id}&token=${orderAccessToken(order.id)}`,
    },
  };
}

// Sent at placement for manual (havale/EFT) orders — the buyer needs the
// payment instructions in their inbox, not just on the confirmation page.
export async function sendOrderReceivedEmail(orderId: string): Promise<void> {
  if (!emailEnabled) {
    console.log(`email disabled, skipping order received email for ${orderId}`);
    return;
  }
  try {
    const loaded = await loadOrderEmail(orderId);
    if (!loaded) return;

    const manualInstructions =
      loaded.paymentProvider === "manual"
        ? ((
            await prisma.setting.findUnique({
              where: { id: 1 },
              select: { manualPaymentInstructions: true },
            })
          )?.manualPaymentInstructions ?? emailCopy.manualFallback)
        : null;

    await sendEmail(
      loaded.to,
      emailCopy.receivedSubject(loaded.props.orderNumber),
      createElement(OrderReceivedEmail, { ...loaded.props, manualInstructions }),
    );
  } catch (error) {
    console.error(`order received email threw for order ${orderId}`, error);
  }
}

// Sent on the PAID → FULFILLED transition (admin marks shipped, R13); the
// tracking box is omitted when both fields were left blank.
export async function sendOrderShippedEmail(orderId: string): Promise<void> {
  if (!emailEnabled) {
    console.log(`email disabled, skipping order shipped email for ${orderId}`);
    return;
  }
  try {
    const loaded = await loadOrderEmail(orderId);
    if (!loaded) return;
    const tracking =
      loaded.carrier || loaded.trackingNumber
        ? { carrier: loaded.carrier, trackingNumber: loaded.trackingNumber }
        : null;
    await sendEmail(
      loaded.to,
      emailCopy.shippedSubject(loaded.props.orderNumber),
      createElement(OrderShippedEmail, { ...loaded.props, tracking }),
    );
  } catch (error) {
    console.error(`order shipped email threw for order ${orderId}`, error);
  }
}

// Sent on the PENDING_PAYMENT → PAID transition (gateway callback or admin
// manual confirmation).
export async function sendOrderPaidEmail(orderId: string): Promise<void> {
  if (!emailEnabled) {
    console.log(`email disabled, skipping order paid email for ${orderId}`);
    return;
  }
  try {
    const loaded = await loadOrderEmail(orderId);
    if (!loaded) return;

    // The invoice PDF rides along (R15), but a rendering failure must not
    // cost the customer their confirmation email.
    let attachments: EmailAttachment[] | undefined;
    try {
      const invoice = await loadInvoiceData(orderId);
      if (invoice) {
        attachments = [
          {
            filename: invoiceCopy.fileName(invoice.orderNumber),
            content: await generateInvoicePdf(invoice),
          },
        ];
      }
    } catch (error) {
      console.error(`invoice pdf generation threw for order ${orderId}`, error);
    }

    await sendEmail(
      loaded.to,
      emailCopy.paidSubject(loaded.props.orderNumber),
      createElement(OrderPaidEmail, loaded.props),
      attachments,
    );
  } catch (error) {
    console.error(`order paid email threw for order ${orderId}`, error);
  }
}
