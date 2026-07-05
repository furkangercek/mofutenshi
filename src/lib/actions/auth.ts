"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { AuthError, CredentialsSignin } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signIn, signOut } from "@/lib/auth";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/auth-emails";
import { consumeAuthToken, createAuthToken } from "@/lib/auth-tokens";
import { safeCallbackPath } from "@/lib/callback-url";
import { authCopy } from "@/lib/copy/auth";
import { emailEnabled } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request-context";

export type AuthFormState = {
  error: string | null;
  message?: string;
  needsVerification?: boolean;
};

const emailSchema = z.email(authCopy.invalidEmail).max(200, authCopy.invalidEmail);

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, authCopy.invalidInput),
});

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? authCopy.invalidInput };

  const email = parsed.data.email.toLowerCase();
  const limitKey = `login:${await clientIp()}:${email}`;
  if (!consumeRateLimit(limitKey, 10, 15 * 60 * 1000)) return { error: authCopy.tooManyAttempts };

  return submitCredentials(email, parsed.data.password, formData.get("callbackUrl"));
}

const registerSchema = z.object({
  name: z.string().trim().min(2, authCopy.nameTooShort).max(100, authCopy.nameTooShort),
  email: emailSchema,
  // bcrypt only reads the first 72 bytes of a password.
  password: z.string().min(8, authCopy.passwordTooShort).max(72, authCopy.invalidInput),
});

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? authCopy.invalidInput };

  if (!consumeRateLimit(`register:${await clientIp()}`, 10, 60 * 60 * 1000))
    return { error: authCopy.tooManyAttempts };

  const email = parsed.data.email.toLowerCase();
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  try {
    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash,
        // R11 env-gating: with email off, verification links could never
        // arrive, so accounts start verified exactly like v1.
        emailVerified: emailEnabled ? null : new Date(),
      },
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") return { error: authCopy.emailTaken };
    throw error;
  }

  if (emailEnabled) {
    const rawToken = await createAuthToken("verify-email", email);
    after(() => sendVerificationEmail(email, parsed.data.name, rawToken));
    redirect(loginNoticePath("verify-sent", formData.get("callbackUrl")));
  }

  return submitCredentials(email, parsed.data.password, formData.get("callbackUrl"));
}

function loginNoticePath(notice: string, callbackUrl: unknown): string {
  const callbackPath = safeCallbackPath(callbackUrl, "/account");
  return `/login?notice=${notice}&callbackUrl=${encodeURIComponent(callbackPath)}`;
}

// Auth.js wraps authorize() errors depending on the call path; the code
// survives either directly or on the cause chain.
function credentialsErrorCode(error: AuthError): string | undefined {
  if (error instanceof CredentialsSignin) return error.code;
  const cause = (error as { cause?: { err?: unknown } }).cause?.err;
  return cause instanceof CredentialsSignin ? cause.code : undefined;
}

// signIn redirects on success (throws NEXT_REDIRECT, which must propagate);
// the guest cart merge runs inside the flow via the Auth.js signIn event.
async function submitCredentials(
  email: string,
  password: string,
  callbackUrl: unknown,
): Promise<AuthFormState> {
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: safeCallbackPath(callbackUrl, "/account"),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (credentialsErrorCode(error) === "email-not-verified")
        return { error: authCopy.emailNotVerified, needsVerification: true };
      return {
        error:
          error.type === "CredentialsSignin" ? authCopy.invalidCredentials : authCopy.genericError,
      };
    }
    throw error;
  }
  return { error: null };
}

// Deliberately answers the same way whether or not the account exists.
export async function resendVerificationAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: authCopy.invalidEmail };
  if (!emailEnabled) return { error: authCopy.emailUnavailable };

  const email = parsed.data.toLowerCase();
  if (!consumeRateLimit(`verify-resend:${await clientIp()}`, 3, 15 * 60 * 1000))
    return { error: authCopy.tooManyAttempts };

  const user = await prisma.user.findUnique({
    where: { email },
    select: { name: true, emailVerified: true, passwordHash: true },
  });
  if (user && !user.emailVerified && user.passwordHash) {
    const rawToken = await createAuthToken("verify-email", email);
    after(() => sendVerificationEmail(email, user.name, rawToken));
  }
  return { error: null, message: authCopy.linkSentGeneric };
}

// Consumes the emailed token via an explicit button POST — the GET link must
// stay side-effect-free because mail scanners prefetch it.
export async function verifyEmailAction(formData: FormData): Promise<void> {
  const token = formData.get("token");
  if (typeof token !== "string" || !token) redirect("/verify-email?invalid=1");

  const email = await consumeAuthToken("verify-email", token);
  if (!email) redirect("/verify-email?invalid=1");

  await prisma.user.updateMany({
    where: { email, emailVerified: null },
    data: { emailVerified: new Date() },
  });
  redirect("/login?notice=verified");
}

// Deliberately answers the same way whether or not the account exists. Also
// covers social-only accounts: resetting sets their first password (R12).
export async function forgotPasswordAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: authCopy.invalidEmail };
  if (!emailEnabled) return { error: authCopy.emailUnavailable };

  const email = parsed.data.toLowerCase();
  if (!consumeRateLimit(`forgot:${await clientIp()}`, 5, 15 * 60 * 1000))
    return { error: authCopy.tooManyAttempts };

  const user = await prisma.user.findUnique({ where: { email }, select: { name: true } });
  if (user) {
    const rawToken = await createAuthToken("password-reset", email);
    after(() => sendPasswordResetEmail(email, user.name, rawToken));
  }
  return { error: null, message: authCopy.linkSentGeneric };
}

const resetSchema = z.object({
  token: z.string().min(1, authCopy.invalidInput),
  password: z.string().min(8, authCopy.passwordTooShort).max(72, authCopy.invalidInput),
});

export async function resetPasswordAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = resetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? authCopy.invalidInput };

  if (!consumeRateLimit(`reset:${await clientIp()}`, 10, 15 * 60 * 1000))
    return { error: authCopy.tooManyAttempts };

  const email = await consumeAuthToken("password-reset", parsed.data.token);
  if (!email) return { error: authCopy.resetInvalidBody };

  const user = await prisma.user.findUnique({ where: { email }, select: { emailVerified: true } });
  if (!user) return { error: authCopy.resetInvalidBody };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.$transaction([
    prisma.user.update({
      where: { email },
      // Clicking the reset link proves email ownership, so it verifies too.
      data: { passwordHash, emailVerified: user.emailVerified ?? new Date() },
    }),
    prisma.verificationToken.deleteMany({ where: { identifier: `verify-email:${email}` } }),
  ]);
  redirect("/login?notice=reset-done");
}

export async function loginWithGoogleAction(formData: FormData): Promise<void> {
  await signIn("google", {
    redirectTo: safeCallbackPath(formData.get("callbackUrl"), "/account"),
  });
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
