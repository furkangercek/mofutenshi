import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminNav, AdminNavFallback, type AdminNavItem } from "@/components/admin/admin-nav";
import { adminCopy } from "@/lib/copy/admin";
import { siteCopy } from "@/lib/copy/common";

export const metadata: Metadata = {
  title: {
    default: adminCopy.panelName,
    template: `%s | ${adminCopy.panelName} | ${siteCopy.name}`,
  },
  robots: { index: false, follow: false },
};

const navItems: AdminNavItem[] = [
  { href: "/admin", label: adminCopy.nav.dashboard, exact: true },
  { href: "/admin/products", label: adminCopy.nav.products },
  { href: "/admin/tags", label: adminCopy.nav.tags },
  { href: "/admin/sales", label: adminCopy.nav.sales },
  { href: "/admin/coupons", label: adminCopy.nav.coupons },
  { href: "/admin/inventory", label: adminCopy.nav.inventory },
  { href: "/admin/orders", label: adminCopy.nav.orders },
  { href: "/admin/analytics", label: adminCopy.nav.analytics },
  { href: "/admin/reviews", label: adminCopy.nav.reviews },
  { href: "/admin/settings", label: adminCopy.nav.settings },
];

// Nav chrome only — access control lives in requireAdmin()/assertAdmin(),
// which every page and server action calls itself.
export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:gap-10 lg:py-10">
      <aside className="shrink-0 lg:w-52">
        <Link href="/admin" className="font-display block text-xl">
          {siteCopy.name}
        </Link>
        <p className="text-muted mt-0.5 text-xs tracking-wide uppercase">{adminCopy.panelName}</p>
        <div className="mt-4">
          <Suspense fallback={<AdminNavFallback items={navItems} label={adminCopy.navLabel} />}>
            <AdminNav items={navItems} label={adminCopy.navLabel} />
          </Suspense>
        </div>
        <Link
          href="/"
          className="text-muted hover:text-ink mt-6 inline-block text-sm underline underline-offset-4"
        >
          {adminCopy.backToStore}
        </Link>
      </aside>
      <main id="main" className="min-w-0 flex-1">
        {children}
      </main>
    </div>
  );
}
