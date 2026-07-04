import type { Metadata } from "next";
import { StaticPage } from "@/components/layout/static-page";
import { contactCopy } from "@/lib/copy/static-pages";

export const metadata: Metadata = {
  title: contactCopy.title,
  description: contactCopy.description,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return <StaticPage copy={contactCopy} />;
}
