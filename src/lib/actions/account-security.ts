"use server";

import bcrypt from "bcryptjs";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth, signOut } from "@/lib/auth";
import { accountSecurityCopy } from "@/lib/copy/account-security";
import { authCopy } from "@/lib/copy/auth";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/rate-limit";

export type SecurityFormState = { error: string | null; success?: string | null };

async function requireUser(): Promise<{ id: string; email: string }> {
  const session = await auth();
  const id = session?.user?.id;
  const email = session?.user?.email;
  if (!id || !email) redirect("/login?callbackUrl=%2Faccount%2Fsecurity");
  return { id, email };
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, authCopy.invalidInput),
  // bcrypt only reads the first 72 bytes of a password.
  newPassword: z.string().min(8, authCopy.passwordTooShort).max(72, authCopy.invalidInput),
});

export async function changePasswordAction(
  _prev: SecurityFormState,
  formData: FormData,
): Promise<SecurityFormState> {
  const { id } = await requireUser();

  if (!consumeRateLimit(`account-security:${id}`, 5, 15 * 60 * 1000))
    return { error: accountSecurityCopy.tooManyAttempts };

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? authCopy.invalidInput };

  const user = await prisma.user.findUnique({
    where: { id },
    select: { passwordHash: true },
  });
  // Social-only accounts set a first password via the reset flow (R12) —
  // there is no current password to verify here.
  if (!user?.passwordHash) return { error: accountSecurityCopy.noPasswordYet };

  const matches = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!matches) return { error: accountSecurityCopy.currentPasswordWrong };

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({ where: { id }, data: { passwordHash } });
  return { error: null, success: accountSecurityCopy.passwordChanged };
}

export async function deleteAccountAction(
  _prev: SecurityFormState,
  formData: FormData,
): Promise<SecurityFormState> {
  const { id, email } = await requireUser();

  if (!consumeRateLimit(`account-security:${id}`, 5, 15 * 60 * 1000))
    return { error: accountSecurityCopy.tooManyAttempts };

  const user = await prisma.user.findUnique({
    where: { id },
    select: { role: true, email: true, passwordHash: true },
  });
  if (!user?.email) return { error: authCopy.invalidInput };
  // The single owner must not lock themselves out of /admin (PRD assumption:
  // one admin, no role UI).
  if (user.role === "ADMIN") return { error: accountSecurityCopy.adminCannotDelete };

  if (user.passwordHash) {
    const password = formData.get("password");
    if (typeof password !== "string" || password.length === 0)
      return { error: authCopy.invalidInput };
    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) return { error: accountSecurityCopy.currentPasswordWrong };
  } else {
    const typed = formData.get("confirmEmail");
    if (typeof typed !== "string" || typed.trim().toLowerCase() !== user.email.trim().toLowerCase())
      return { error: accountSecurityCopy.deleteEmailMismatch };
  }

  // Orders detach via SetNull (legal retention); everything else user-owned
  // cascades. Pending auth tokens share the email, not the user id — clear
  // them explicitly.
  await prisma.$transaction([
    prisma.user.delete({ where: { id } }),
    prisma.verificationToken.deleteMany({
      where: { identifier: { in: [`verify:${user.email}`, `reset:${user.email}`] } },
    }),
  ]);
  // Approved reviews by this user just left the public catalog surfaces.
  updateTag("reviews");

  console.log(`account deleted for ${email} (orders retained, detached)`);
  await signOut({ redirectTo: "/" });
  return { error: null };
}
