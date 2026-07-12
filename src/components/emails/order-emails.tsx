import type { CSSProperties } from "react";
import {
  EmailButton,
  EmailShell,
  headingText,
  mutedText,
  palette,
  text,
} from "@/components/emails/shared";
import { adminEmailCopy, emailCopy } from "@/lib/copy/emails";

// Order lifecycle templates. All money values arrive pre-formatted — kuruş
// never reaches the templates.

type OrderEmailLine = {
  name: string;
  variantLabel: string;
  quantity: number;
  lineTotal: string;
};

export type OrderEmailProps = {
  orderNumber: string;
  greetingName: string;
  lines: OrderEmailLine[];
  subtotal: string;
  discount: string | null;
  coupon: { label: string; amount: string } | null;
  shipping: string;
  total: string;
  addressLines: string[];
  confirmationUrl: string;
  manualInstructions?: string | null;
  tracking?: { carrier: string | null; trackingNumber: string | null } | null;
};

function MultilineText({ value, style }: { value: string; style: CSSProperties }) {
  const lines = value.split("\n");
  return (
    <p style={style}>
      {lines.map((line, index) => (
        <span key={index}>
          {line}
          {index < lines.length - 1 && <br />}
        </span>
      ))}
    </p>
  );
}

function OrderEmail({
  title,
  lead,
  order,
}: {
  title: string;
  lead: string;
  order: OrderEmailProps;
}) {
  return (
    <EmailShell title={title}>
      <h1 style={headingText}>{title}</h1>
      <p style={{ ...text, marginTop: "12px" }}>{emailCopy.greeting(order.greetingName)}</p>
      <p style={{ ...mutedText, marginTop: "8px" }}>{lead}</p>
      <p style={{ ...text, marginTop: "16px" }}>
        {emailCopy.orderNumberLabel}: <strong>{order.orderNumber}</strong>
      </p>

      {order.tracking && (
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{ marginTop: "24px" }}
        >
          <tbody>
            <tr>
              <td style={{ backgroundColor: palette.ghost, borderRadius: "6px", padding: "16px" }}>
                <p style={{ ...text, fontWeight: "bold" }}>{emailCopy.trackingHeading}</p>
                {order.tracking.carrier && (
                  <p style={{ ...mutedText, marginTop: "8px" }}>
                    {emailCopy.carrierLabel}: {order.tracking.carrier}
                  </p>
                )}
                {order.tracking.trackingNumber && (
                  <p style={{ ...mutedText, marginTop: order.tracking.carrier ? "0" : "8px" }}>
                    {emailCopy.trackingNumberLabel}: {order.tracking.trackingNumber}
                  </p>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      )}

      {order.manualInstructions && (
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{ marginTop: "24px" }}
        >
          <tbody>
            <tr>
              <td style={{ backgroundColor: palette.ghost, borderRadius: "6px", padding: "16px" }}>
                <p style={{ ...text, fontWeight: "bold" }}>{emailCopy.manualHeading}</p>
                <MultilineText
                  value={order.manualInstructions}
                  style={{ ...mutedText, marginTop: "8px" }}
                />
              </td>
            </tr>
          </tbody>
        </table>
      )}

      <OrderSummaryTable order={order} />

      <p style={{ ...text, fontWeight: "bold", marginTop: "24px" }}>{emailCopy.addressHeading}</p>
      {order.addressLines.map((line, index) => (
        <p key={index} style={{ ...mutedText, marginTop: index === 0 ? "8px" : 0 }}>
          {line}
        </p>
      ))}

      <EmailButton href={order.confirmationUrl} label={emailCopy.viewOrder} />
    </EmailShell>
  );
}

function OrderSummaryTable({ order }: { order: OrderEmailProps }) {
  const cellBorder = `1px solid ${palette.border}`;
  return (
    <>
      <p style={{ ...text, fontWeight: "bold", marginTop: "24px" }}>{emailCopy.itemsHeading}</p>
      <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
        <tbody>
          {order.lines.map((line, index) => (
            <tr key={index}>
              <td style={{ padding: "12px 0", borderBottom: cellBorder }}>
                <p style={text}>{line.name}</p>
                {line.variantLabel && (
                  <p style={{ ...mutedText, fontSize: "12px" }}>{line.variantLabel}</p>
                )}
                <p style={{ ...mutedText, fontSize: "12px" }}>
                  {emailCopy.quantityLabel}: {line.quantity}
                </p>
              </td>
              <td
                align="right"
                style={{ padding: "12px 0", borderBottom: cellBorder, verticalAlign: "top" }}
              >
                <p style={text}>{line.lineTotal}</p>
              </td>
            </tr>
          ))}
          <SummaryRow label={emailCopy.subtotal} value={order.subtotal} />
          {order.discount && <SummaryRow label={emailCopy.discount} value={order.discount} />}
          {order.coupon && <SummaryRow label={order.coupon.label} value={order.coupon.amount} />}
          <SummaryRow label={emailCopy.shipping} value={order.shipping} />
          <SummaryRow label={emailCopy.total} value={order.total} bold />
        </tbody>
      </table>
      <p style={{ ...mutedText, fontSize: "12px", marginTop: "8px" }}>{emailCopy.kdvNote}</p>
    </>
  );
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  const style: CSSProperties = bold ? { ...text, fontWeight: "bold" } : mutedText;
  return (
    <tr>
      <td style={{ paddingTop: "8px" }}>
        <p style={style}>{label}</p>
      </td>
      <td align="right" style={{ paddingTop: "8px" }}>
        <p style={style}>{value}</p>
      </td>
    </tr>
  );
}

export function OrderReceivedEmail(order: OrderEmailProps) {
  return <OrderEmail title={emailCopy.receivedTitle} lead={emailCopy.receivedLead} order={order} />;
}

export function OrderPaidEmail(order: OrderEmailProps) {
  return <OrderEmail title={emailCopy.paidTitle} lead={emailCopy.paidLead} order={order} />;
}

// Owner-facing notification (R29.1): no greeting, customer contact up top,
// button into the admin order detail instead of the confirmation page.
type AdminNewOrderEmailProps = OrderEmailProps & {
  customerEmail: string;
  adminUrl: string;
  kind: "placed" | "paid";
};

export function AdminNewOrderEmail(order: AdminNewOrderEmailProps) {
  const lead = order.kind === "placed" ? adminEmailCopy.placedLead : adminEmailCopy.paidLead;
  return (
    <EmailShell title={adminEmailCopy.title}>
      <h1 style={headingText}>{adminEmailCopy.title}</h1>
      <p style={{ ...mutedText, marginTop: "8px" }}>{lead}</p>
      <p style={{ ...text, marginTop: "16px" }}>
        {emailCopy.orderNumberLabel}: <strong>{order.orderNumber}</strong>
      </p>

      <p style={{ ...text, fontWeight: "bold", marginTop: "24px" }}>
        {adminEmailCopy.customerHeading}
      </p>
      <p style={{ ...mutedText, marginTop: "8px" }}>{order.customerEmail}</p>
      {order.addressLines.map((line, index) => (
        <p key={index} style={mutedText}>
          {line}
        </p>
      ))}

      <OrderSummaryTable order={order} />

      <EmailButton href={order.adminUrl} label={adminEmailCopy.viewInAdmin} />
    </EmailShell>
  );
}

export function OrderShippedEmail(order: OrderEmailProps) {
  const hasTracking = Boolean(order.tracking?.carrier || order.tracking?.trackingNumber);
  return (
    <OrderEmail
      title={emailCopy.shippedTitle}
      lead={hasTracking ? emailCopy.shippedLead : emailCopy.shippedLeadNoTracking}
      order={order}
    />
  );
}
