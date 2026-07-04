import type { Metadata } from "next";
import { StaticPage } from "@/components/layout/static-page";
import { aboutCopy } from "@/lib/copy/static-pages";

export const metadata: Metadata = {
  title: aboutCopy.title,
  description: aboutCopy.description,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return <StaticPage copy={aboutCopy} />;
}
