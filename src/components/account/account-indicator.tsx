import Link from "next/link";
import { UserRound } from "lucide-react";
import { auth } from "@/lib/auth";
import { authCopy } from "@/lib/copy/auth";

export function AccountLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="text-ink hover:bg-background inline-flex size-11 items-center justify-center rounded-md"
    >
      <UserRound aria-hidden className="size-5" />
    </Link>
  );
}

// Reads the session cookie, so it must live in a Suspense hole to keep PPR
// shells static (same pattern as the cart indicator).
export async function AccountIndicator() {
  const session = await auth();
  return session?.user ? (
    <AccountLink href="/account" label={authCopy.accountTitle} />
  ) : (
    <AccountLink href="/login" label={authCopy.loginTitle} />
  );
}
