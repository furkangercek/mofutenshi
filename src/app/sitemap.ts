import type { MetadataRoute } from "next";
import { getSitemapData } from "@/lib/queries/catalog";
import { siteUrl } from "@/lib/site";

// Complete product/tag URL list is the SEO offset for infinite scroll
// (PRD §9.6): every product must be reachable by crawlers without JS.

const staticRoutes: {
  path: string;
  changeFrequency: "daily" | "monthly";
  priority: number;
}[] = [
  { path: "", changeFrequency: "daily", priority: 1 },
  { path: "/products", changeFrequency: "daily", priority: 0.9 },
  { path: "/sales", changeFrequency: "daily", priority: 0.8 },
  { path: "/about", changeFrequency: "monthly", priority: 0.3 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.3 },
  { path: "/legal/terms", changeFrequency: "monthly", priority: 0.2 },
  { path: "/legal/privacy", changeFrequency: "monthly", priority: 0.2 },
  { path: "/legal/shipping-returns", changeFrequency: "monthly", priority: 0.2 },
  { path: "/legal/mesafeli-satis-sozlesmesi", changeFrequency: "monthly", priority: 0.2 },
  { path: "/legal/on-bilgilendirme", changeFrequency: "monthly", priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, tags } = await getSitemapData();

  return [
    ...staticRoutes.map((route) => ({
      url: `${siteUrl}${route.path}`,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...tags.map((tag) => ({
      url: `${siteUrl}/t/${tag.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((product) => ({
      url: `${siteUrl}/p/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      ...(product.imageSrc ? { images: [product.imageSrc] } : {}),
    })),
  ];
}
