import Link from "next/link";
import { redirect } from "next/navigation";
import { CredentialsForm } from "@/components/auth/credentials-form";
import { GoogleSignIn } from "@/components/auth/google-signin";
import { auth } from "@/lib/auth";
import { safeCallbackPath } from "@/lib/callback-url";
import { authCopy } from "@/lib/copy/auth";

const content = {
  login: {
    title: authCopy.loginTitle,
    crossPrompt: authCopy.noAccountPrompt,
    crossPath: "/register",
    crossLabel: authCopy.goToRegister,
  },
  register: {
    title: authCopy.registerTitle,
    crossPrompt: authCopy.haveAccountPrompt,
    crossPath: "/login",
    crossLabel: authCopy.goToLogin,
  },
} as const;

export async function AuthPage({
  mode,
  searchParams,
}: {
  mode: "login" | "register";
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const callbackUrl = typeof params.callbackUrl === "string" ? params.callbackUrl : undefined;

  const session = await auth();
  if (session?.user) redirect(safeCallbackPath(callbackUrl, "/account"));

  const { title, crossPrompt, crossPath, crossLabel } = content[mode];
  const crossHref = callbackUrl
    ? `${crossPath}?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : crossPath;

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl">{title}</h1>
      <div className="mt-8">
        <CredentialsForm mode={mode} callbackUrl={callbackUrl} />
      </div>
      <GoogleSignIn callbackUrl={callbackUrl} />
      <p className="text-muted mt-8 text-sm">
        {crossPrompt}{" "}
        <Link href={crossHref} className="text-ink underline underline-offset-2">
          {crossLabel}
        </Link>
      </p>
    </div>
  );
}
