import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { BootSplash } from "@/components/ui/loader";
import { navCopy, siteCopy } from "@/lib/copy/common";
import { siteUrl } from "@/lib/site";
import "./globals.css";

// Body font. Display font is an interim pick — final choice pending designer
// (docs/STATUS.md); both must keep full Turkish glyph coverage (latin-ext).
const inter = Inter({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteCopy.name} — ${siteCopy.tagline}`,
    template: `%s | ${siteCopy.name}`,
  },
  description: siteCopy.description,
  openGraph: {
    siteName: siteCopy.name,
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${inter.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <BootSplash />
        <a
          href="#main"
          className="focus:bg-surface sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:px-4 focus:py-2"
        >
          {navCopy.skipToContent}
        </a>
        {children}
      </body>
    </html>
  );
}
