import type { Metadata } from "next";
import { AuthPage } from "@/components/auth/auth-page";
import { authCopy } from "@/lib/copy/auth";

export const metadata: Metadata = {
  title: authCopy.loginTitle,
  robots: { index: false },
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <AuthPage mode="login" searchParams={searchParams} />;
}
