import type { NextConfig } from "next";

// R2_PUBLIC_URL is unset until the bucket exists; images then fall back to
// the gradient placeholder (src/components/ui/product-image.tsx).
const r2PublicUrl = process.env.R2_PUBLIC_URL;

const nextConfig: NextConfig = {
  cacheComponents: true,
  // The iyzipay SDK self-assembles via fs.readdirSync + dynamic require and
  // cannot be bundled; load it from node_modules at runtime instead.
  serverExternalPackages: ["iyzipay"],
  images: {
    remotePatterns: r2PublicUrl ? [new URL(`${r2PublicUrl}/**`)] : [],
  },
};

export default nextConfig;
