import { createElement } from "react";
import { PasswordResetEmail, VerifyEmailEmail } from "@/components/emails/auth-emails";
import { emailCopy } from "@/lib/copy/emails";
import { sendEmail } from "@/lib/email";
import { siteUrl } from "@/lib/site";

// Verification / reset emails. Callers create the token synchronously (a
// failure there must surface) and hand the raw token here via after() — like
// order emails, a send failure is logged, never thrown.

export async function sendVerificationEmail(
  email: string,
  name: string | null,
  rawToken: string,
): Promise<void> {
  await sendEmail(
    email,
    emailCopy.verifySubject,
    createElement(VerifyEmailEmail, {
      greetingName: name,
      actionUrl: `${siteUrl}/verify-email?token=${rawToken}`,
    }),
  );
}

export async function sendPasswordResetEmail(
  email: string,
  name: string | null,
  rawToken: string,
): Promise<void> {
  await sendEmail(
    email,
    emailCopy.resetSubject,
    createElement(PasswordResetEmail, {
      greetingName: name,
      actionUrl: `${siteUrl}/reset-password?token=${rawToken}`,
    }),
  );
}
