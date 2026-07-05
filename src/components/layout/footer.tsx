import Link from "next/link";
import { cacheLife } from "next/cache";
import { footerCopy, siteCopy } from "@/lib/copy/common";

const columns = [
  {
    heading: footerCopy.corporateHeading,
    links: [
      { href: "/about", label: footerCopy.about },
      { href: "/contact", label: footerCopy.contact },
    ],
  },
  {
    heading: footerCopy.legalHeading,
    links: [
      { href: "/legal/terms", label: footerCopy.terms },
      { href: "/legal/privacy", label: footerCopy.privacy },
      { href: "/legal/shipping-returns", label: footerCopy.shippingReturns },
      { href: "/legal/mesafeli-satis-sozlesmesi", label: footerCopy.distanceSales },
      { href: "/legal/on-bilgilendirme", label: footerCopy.preInformation },
    ],
  },
];

export async function Footer() {
  "use cache";
  // Cached scope so the copyright year is legal under Cache Components;
  // daily revalidation keeps it fresh across New Year's.
  cacheLife("days");

  return (
    <footer className="border-border bg-surface border-t">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6">
        <div>
          <p className="font-display text-lg">{siteCopy.name}</p>
          <p className="text-muted mt-2 max-w-xs text-sm">{siteCopy.tagline}</p>
        </div>
        {columns.map((column) => (
          <nav key={column.heading} aria-label={column.heading}>
            <h2 className="text-sm font-semibold">{column.heading}</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-muted hover:text-ink text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-border border-t">
        <p className="text-muted mx-auto max-w-6xl px-4 py-4 text-xs sm:px-6">
          © {new Date().getFullYear()} {siteCopy.name}. {footerCopy.rights}
        </p>
      </div>
    </footer>
  );
}
