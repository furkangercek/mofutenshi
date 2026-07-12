import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ChangePasswordForm, DeleteAccountForm } from "@/components/account/security-forms";
import { auth } from "@/lib/auth";
import { accountSecurityCopy } from "@/lib/copy/account-security";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: accountSecurityCopy.pageTitle,
  robots: { index: false },
};

export default async function AccountSecurityPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=%2Faccount%2Fsecurity");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, passwordHash: true },
  });
  if (!user) redirect("/login?callbackUrl=%2Faccount%2Fsecurity");
  const hasPassword = Boolean(user.passwordHash);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl">{accountSecurityCopy.pageTitle}</h1>

      <section className="border-border mt-8 rounded-lg border p-6">
        <h2 className="font-display text-xl">{accountSecurityCopy.passwordHeading}</h2>
        {hasPassword ? (
          <>
            <div className="mt-4">
              <ChangePasswordForm />
            </div>
            <p className="text-muted mt-4 text-sm">{accountSecurityCopy.sessionNote}</p>
          </>
        ) : (
          <p className="text-muted mt-2 text-sm">{accountSecurityCopy.noPasswordYet}</p>
        )}
      </section>

      {user.role !== "ADMIN" && (
        <section className="border-border mt-8 rounded-lg border p-6">
          <h2 className="font-display text-xl">{accountSecurityCopy.deleteHeading}</h2>
          <p className="text-muted mt-2 text-sm">{accountSecurityCopy.deleteLead}</p>
          <div className="mt-4">
            <DeleteAccountForm hasPassword={hasPassword} />
          </div>
        </section>
      )}
    </div>
  );
}
