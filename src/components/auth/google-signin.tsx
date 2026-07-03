import { loginWithGoogleAction } from "@/lib/actions/auth";
import { googleEnabled } from "@/lib/auth";
import { authCopy } from "@/lib/copy/auth";

// Renders nothing until Google OAuth credentials are provisioned (env vars).
export function GoogleSignIn({ callbackUrl }: { callbackUrl?: string }) {
  if (!googleEnabled) return null;

  return (
    <div className="mt-6">
      <div className="text-muted flex items-center gap-3 text-sm" aria-hidden>
        <span className="bg-border h-px flex-1" />
        {authCopy.orSeparator}
        <span className="bg-border h-px flex-1" />
      </div>
      <form action={loginWithGoogleAction} className="mt-6">
        {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
        <button
          type="submit"
          className="border-border bg-surface hover:bg-background inline-flex h-11 w-full items-center justify-center rounded-md border font-medium transition active:scale-[0.97]"
        >
          {authCopy.continueWithGoogle}
        </button>
      </form>
    </div>
  );
}
