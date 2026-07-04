import type { Metadata } from "next";
import { StaticPage } from "@/components/layout/static-page";
import { termsCopy } from "@/lib/copy/static-pages";

export const metadata: Metadata = {
  title: termsCopy.title,
  description: termsCopy.description,
  alternates: { canonical: "/legal/terms" },
};

export default function TermsPage() {
  return <StaticPage copy={termsCopy} />;
}
