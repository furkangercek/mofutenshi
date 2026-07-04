"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type AdminNavItem = { href: string; label: string; exact?: boolean };

const linkBase = "block rounded-md px-3 py-3 text-sm font-medium transition lg:py-2";

export function AdminNav({ items, label }: { items: AdminNavItem[]; label: string }) {
  const pathname = usePathname();

  return <AdminNavList items={items} label={label} pathname={pathname} />;
}

// Static fallback while the pathname-aware nav streams on dynamic routes
// (usePathname is uncached data during prerender under cacheComponents).
export function AdminNavFallback({ items, label }: { items: AdminNavItem[]; label: string }) {
  return <AdminNavList items={items} label={label} pathname={null} />;
}

function AdminNavList({
  items,
  label,
  pathname,
}: {
  items: AdminNavItem[];
  label: string;
  pathname: string | null;
}) {
  return (
    <nav aria-label={label}>
      <ul className="flex flex-wrap gap-1 lg:flex-col">
        {items.map((item) => {
          const active =
            pathname !== null &&
            (item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`));
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`${linkBase} ${
                  active ? "bg-primary text-primary-contrast" : "hover:bg-ghost text-muted"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
