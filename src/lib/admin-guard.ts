import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { Session } from "next-auth";

type AdminUser = Session["user"];

// Page gate: anonymous users go to login; authenticated non-admins get a 404
// so the admin surface stays invisible. Every /admin page must call this —
// the layout rendering around a page is not access control.
export async function requireAdmin(callbackPath: string = "/admin"): Promise<AdminUser> {
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
  if (session.user.role !== "ADMIN") notFound();
  return session.user;
}

// Mutation gate: server actions throw instead of redirecting, so a forged
// request gets an opaque failure rather than a navigation.
export async function assertAdmin(): Promise<AdminUser> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("admin authorization required");
  return session.user;
}
