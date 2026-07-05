import type { Metadata } from "next";
import { StaticPage } from "@/components/layout/static-page";
import { mesafeliSatisCopy } from "@/lib/copy/legal";

export const metadata: Metadata = {
  title: mesafeliSatisCopy.title,
  description: mesafeliSatisCopy.description,
  alternates: { canonical: "/legal/mesafeli-satis-sozlesmesi" },
};

export default function MesafeliSatisPage() {
  return <StaticPage copy={mesafeliSatisCopy} />;
}
