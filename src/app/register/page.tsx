import type { Metadata } from "next";
import { AuthPage } from "@/components/auth/auth-page";
import { authCopy } from "@/lib/copy/auth";

export const metadata: Metadata = {
  title: authCopy.registerTitle,
  robots: { index: false },
};

export default function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <AuthPage mode="register" searchParams={searchParams} />;
}
