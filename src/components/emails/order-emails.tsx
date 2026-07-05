import type { CSSProperties, ReactNode } from "react";
import { emailCopy } from "@/lib/copy/emails";

// Transactional email templates: plain React + inline styles + tables so any
// email client renders them (@react-email/components is deprecated upstream;
// @react-email/render turns these into html/text in src/lib/email.ts).
// All money values arrive pre-formatted — kuruş never reaches the templates.

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
  shipping: string;
  total: string;
  addressLines: string[];
  confirmationUrl: string;
  manualInstructions?: string | null;
};

const palette = {
  ink: "#000000",
  background: "#f2f2f2",
  surface: "#ffffff",
  muted: "#4b4f66",
  border: "#b8bcd0",
  primary: "#b6bff2",
  accent: "#d9c99a",
  ghost: "#f4f3f9",
};

const bodyFont = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const displayFont = "Georgia, 'Times New Roman', serif";

const text: CSSProperties = {
  margin: 0,
  fontFamily: bodyFont,
  fontSize: "14px",
  lineHeight: "22px",
  color: palette.ink,
};

const mutedText: CSSProperties = { ...text, color: palette.muted };

function EmailShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <html lang="tr">
      {/* eslint-disable-next-line @next/next/no-head-element -- standalone email document, not a Next.js page */}
      <head>
        <meta charSet="utf-8" />
        <title>{title}</title>
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: palette.background }}>
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{ backgroundColor: palette.background, padding: "24px 12px" }}
        >
          <tbody>
            <tr>
              <td align="center">
                <table
                  role="presentation"
                  width={560}
                  cellPadding={0}
                  cellSpacing={0}
                  style={{
                    width: "100%",
                    maxWidth: "560px",
                    backgroundColor: palette.surface,
                    border: `1px solid ${palette.border}`,
                    borderRadius: "8px",
                  }}
                >
                  <tbody>
                    <tr>
                      <td style={{ padding: "32px 32px 0" }}>
                        <p
                          style={{
                            margin: 0,
                            fontFamily: displayFont,
                            fontSize: "22px",
                            color: palette.ink,
                          }}
                        >
                          MofuTenshi
                        </p>
                        <hr
                          style={{
                            margin: "16px 0 0",
                            border: "none",
                            borderTop: `2px solid ${palette.accent}`,
                          }}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "24px 32px 32px" }}>{children}</td>
                    </tr>
                  </tbody>
                </table>
                <p style={{ ...mutedText, fontSize: "12px", margin: "16px 8px 0" }}>
                  {emailCopy.footerNote}
                </p>
                <p style={{ ...mutedText, fontSize: "12px", margin: "4px 8px 0" }}>
                  {emailCopy.footerQuestions}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}

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
  const cellBorder = `1px solid ${palette.border}`;
  return (
    <EmailShell title={title}>
      <h1
        style={{
          margin: 0,
          fontFamily: displayFont,
          fontSize: "20px",
          fontWeight: "normal",
          color: palette.ink,
        }}
      >
        {title}
      </h1>
      <p style={{ ...text, marginTop: "12px" }}>{emailCopy.greeting(order.greetingName)}</p>
      <p style={{ ...mutedText, marginTop: "8px" }}>{lead}</p>
      <p style={{ ...text, marginTop: "16px" }}>
        {emailCopy.orderNumberLabel}: <strong>{order.orderNumber}</strong>
      </p>

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
          <SummaryRow label={emailCopy.shipping} value={order.shipping} />
          <SummaryRow label={emailCopy.total} value={order.total} bold />
        </tbody>
      </table>
      <p style={{ ...mutedText, fontSize: "12px", marginTop: "8px" }}>{emailCopy.kdvNote}</p>

      <p style={{ ...text, fontWeight: "bold", marginTop: "24px" }}>{emailCopy.addressHeading}</p>
      {order.addressLines.map((line, index) => (
        <p key={index} style={{ ...mutedText, marginTop: index === 0 ? "8px" : 0 }}>
          {line}
        </p>
      ))}

      <table role="presentation" cellPadding={0} cellSpacing={0} style={{ marginTop: "28px" }}>
        <tbody>
          <tr>
            <td
              style={{
                backgroundColor: palette.primary,
                borderRadius: "6px",
              }}
            >
              <a
                href={order.confirmationUrl}
                style={{
                  display: "inline-block",
                  padding: "12px 24px",
                  fontFamily: bodyFont,
                  fontSize: "14px",
                  fontWeight: "bold",
                  color: palette.ink,
                  textDecoration: "none",
                }}
              >
                {emailCopy.viewOrder}
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    </EmailShell>
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
