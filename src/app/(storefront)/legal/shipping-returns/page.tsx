import type { Metadata } from "next";
import { StaticPage } from "@/components/layout/static-page";
import { shippingReturnsCopy } from "@/lib/copy/static-pages";

export const metadata: Metadata = {
  title: shippingReturnsCopy.title,
  description: shippingReturnsCopy.description,
  alternates: { canonical: "/legal/shipping-returns" },
};

export default function ShippingReturnsPage() {
  return <StaticPage copy={shippingReturnsCopy} />;
}
