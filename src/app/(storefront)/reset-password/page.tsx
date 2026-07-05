import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { ResetPasswordForm } from "@/components/auth/password-flow-forms";
import { peekAuthToken } from "@/lib/auth-tokens";
import { authCopy } from "@/lib/copy/auth";

export const metadata: Metadata = {
  title: authCopy.resetTitle,
  robots: { index: false },
};

function InvalidToken() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl">{authCopy.resetInvalidTitle}</h1>
      <p className="text-muted mt-4">{authCopy.resetInvalidBody}</p>
      <div className="mt-8">
        <ButtonLink href="/forgot-password">{authCopy.requestNewLink}</ButtonLink>
      </div>
    </div>
  );
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : null;
  if (!token || (await peekAuthToken("password-reset", token)) === null) return <InvalidToken />;

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl">{authCopy.resetTitle}</h1>
      <p className="text-muted mt-4">{authCopy.resetLead}</p>
      <div className="mt-8">
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}
