import { render } from "@react-email/render";
import { Resend } from "resend";
import type { ReactElement } from "react";

// Resend transport. Like R2/iyzico/Google OAuth, dormant until the owner
// provisions credentials (.env.example): both RESEND_API_KEY and EMAIL_FROM
// must be set or sends are skipped with a log line.
const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM;
const replyTo = process.env.EMAIL_REPLY_TO;

export const emailEnabled = Boolean(apiKey && from);

// Owner-facing notifications (R29.1): optional on top of the Resend pair —
// customer emails keep working without it.
export const adminEmail = process.env.EMAIL_ADMIN || null;

let client: Resend | null = null;

function resend(): Resend {
  if (!emailEnabled) throw new Error("email is not configured");
  client ??= new Resend(apiKey);
  return client;
}

export type EmailAttachment = { filename: string; content: Buffer };

// Never throws: senders run inside next/server after() on payment paths, and
// a failed email must never look like a failed payment.
export async function sendEmail(
  to: string,
  subject: string,
  template: ReactElement,
  attachments?: EmailAttachment[],
): Promise<void> {
  if (!emailEnabled) {
    console.log(`email disabled, skipping "${subject}" to ${to}`);
    return;
  }
  try {
    const [html, text] = await Promise.all([
      render(template),
      render(template, { plainText: true }),
    ]);
    const { error } = await resend().emails.send({
      from: from!,
      to,
      subject,
      html,
      text,
      ...(replyTo ? { replyTo } : {}),
      ...(attachments?.length ? { attachments } : {}),
    });
    if (error) console.error(`email send failed for "${subject}" to ${to}`, error);
  } catch (error) {
    console.error(`email send threw for "${subject}" to ${to}`, error);
  }
}
