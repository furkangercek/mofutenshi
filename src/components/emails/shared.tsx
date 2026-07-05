import type { CSSProperties, ReactNode } from "react";
import { emailCopy } from "@/lib/copy/emails";

// Shared chrome for all transactional emails: plain React + inline styles +
// tables so any email client renders them (@react-email/components is
// deprecated upstream; @react-email/render turns these into html/text in
// src/lib/email.ts). Hex values mirror the semantic tokens in globals.css —
// email clients support neither CSS variables nor stylesheets reliably.

export const palette = {
  ink: "#000000",
  background: "#f2f2f2",
  surface: "#ffffff",
  muted: "#4b4f66",
  border: "#b8bcd0",
  primary: "#b6bff2",
  accent: "#d9c99a",
  ghost: "#f4f3f9",
};

export const bodyFont = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
export const displayFont = "Georgia, 'Times New Roman', serif";

export const text: CSSProperties = {
  margin: 0,
  fontFamily: bodyFont,
  fontSize: "14px",
  lineHeight: "22px",
  color: palette.ink,
};

export const mutedText: CSSProperties = { ...text, color: palette.muted };

export const headingText: CSSProperties = {
  margin: 0,
  fontFamily: displayFont,
  fontSize: "20px",
  fontWeight: "normal",
  color: palette.ink,
};

export function EmailShell({ title, children }: { title: string; children: ReactNode }) {
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

export function EmailButton({ href, label }: { href: string; label: string }) {
  return (
    <table role="presentation" cellPadding={0} cellSpacing={0} style={{ marginTop: "24px" }}>
      <tbody>
        <tr>
          <td style={{ backgroundColor: palette.primary, borderRadius: "6px" }}>
            <a
              href={href}
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
              {label}
            </a>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
