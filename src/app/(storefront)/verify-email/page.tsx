import type { Metadata } from "next";
import { Button, ButtonLink } from "@/components/ui/button";
import { verifyEmailAction } from "@/lib/actions/auth";
import { peekAuthToken } from "@/lib/auth-tokens";
import { authCopy } from "@/lib/copy/auth";

export const metadata: Metadata = {
  title: authCopy.verifyPageTitle,
  robots: { index: false },
};

function InvalidToken() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl">{authCopy.verifyInvalidTitle}</h1>
      <p className="text-muted mt-4">{authCopy.verifyInvalidBody}</p>
      <div className="mt-8">
        <ButtonLink href="/login">{authCopy.goToLogin}</ButtonLink>
      </div>
    </div>
  );
}

// The emailed link lands here as a plain GET; the token is consumed only by
// the button's POST so mail scanners prefetching the URL burn nothing.
export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : null;
  if (!token || (await peekAuthToken("verify-email", token)) === null) return <InvalidToken />;

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl">{authCopy.verifyPageTitle}</h1>
      <p className="text-muted mt-4">{authCopy.verifyConfirmLead}</p>
      <form action={verifyEmailAction} className="mt-8">
        <input type="hidden" name="token" value={token} />
        <Button type="submit">{authCopy.verifyConfirmButton}</Button>
      </form>
    </div>
  );
}
