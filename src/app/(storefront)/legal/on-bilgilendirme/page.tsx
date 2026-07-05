import type { Metadata } from "next";
import { StaticPage } from "@/components/layout/static-page";
import { onBilgilendirmeCopy } from "@/lib/copy/legal";

export const metadata: Metadata = {
  title: onBilgilendirmeCopy.title,
  description: onBilgilendirmeCopy.description,
  alternates: { canonical: "/legal/on-bilgilendirme" },
};

export default function OnBilgilendirmePage() {
  return <StaticPage copy={onBilgilendirmeCopy} />;
}
