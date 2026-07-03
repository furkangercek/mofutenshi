import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions/auth";
import { auth } from "@/lib/auth";
import { authCopy } from "@/lib/copy/auth";

export const metadata: Metadata = {
  title: authCopy.accountTitle,
  robots: { index: false },
};

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=%2Faccount");

  const displayName = session.user.name?.trim() || session.user.email || "";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl">{authCopy.accountTitle}</h1>
      <p className="text-muted mt-2">{authCopy.greeting(displayName)}</p>

      <section className="border-border mt-8 rounded-lg border p-6">
        <h2 className="font-display text-xl">{authCopy.ordersHeading}</h2>
        <p className="text-muted mt-2 text-sm">{authCopy.ordersEmpty}</p>
        <ButtonLink href="/products" className="mt-4">
          {authCopy.browseCta}
        </ButtonLink>
      </section>

      <form action={logoutAction} className="mt-8">
        <button
          type="submit"
          className="border-border bg-surface hover:bg-background inline-flex h-11 items-center justify-center rounded-md border px-6 font-medium transition active:scale-[0.97]"
        >
          {authCopy.logout}
        </button>
      </form>
    </div>
  );
}
