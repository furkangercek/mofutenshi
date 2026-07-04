import type { Metadata } from "next";
import { StaticPage } from "@/components/layout/static-page";
import { privacyCopy } from "@/lib/copy/static-pages";

export const metadata: Metadata = {
  title: privacyCopy.title,
  description: privacyCopy.description,
  alternates: { canonical: "/legal/privacy" },
};

export default function PrivacyPage() {
  return <StaticPage copy={privacyCopy} />;
}
