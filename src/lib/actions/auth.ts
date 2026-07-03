"use server";

import { headers } from "next/headers";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signIn, signOut } from "@/lib/auth";
import { safeCallbackPath } from "@/lib/callback-url";
import { authCopy } from "@/lib/copy/auth";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/rate-limit";

export type AuthFormState = { error: string | null };

async function clientIp(): Promise<string> {
  const forwarded = (await headers()).get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

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
    await prisma.user.create({ data: { name: parsed.data.name, email, passwordHash } });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") return { error: authCopy.emailTaken };
    throw error;
  }

  return submitCredentials(email, parsed.data.password, formData.get("callbackUrl"));
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
      return {
        error:
          error.type === "CredentialsSignin" ? authCopy.invalidCredentials : authCopy.genericError,
      };
    }
    throw error;
  }
  return { error: null };
}

export async function loginWithGoogleAction(formData: FormData): Promise<void> {
  await signIn("google", {
    redirectTo: safeCallbackPath(formData.get("callbackUrl"), "/account"),
  });
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
