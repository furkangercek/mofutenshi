import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/password-flow-forms";
import { authCopy } from "@/lib/copy/auth";

export const metadata: Metadata = {
  title: authCopy.forgotTitle,
  robots: { index: false },
};

// Deliberately does NOT read emailEnabled: this page prerenders fully static,
// so build-time env would be baked in (the production image builds without
// runtime secrets). The action checks the flag at request time instead.
export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl">{authCopy.forgotTitle}</h1>
      <p className="text-muted mt-4">{authCopy.forgotLead}</p>
      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
      <p className="text-muted mt-8 text-sm">
        <Link href="/login" className="text-ink underline underline-offset-2">
          {authCopy.backToLogin}
        </Link>
      </p>
    </div>
  );
}
