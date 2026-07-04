import type { NextConfig } from "next";

// R2_PUBLIC_URL is unset until the bucket exists; images then fall back to
// the gradient placeholder (src/components/ui/product-image.tsx).
const r2PublicUrl = process.env.R2_PUBLIC_URL;

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    // Admin image uploads post the original file to a server action;
    // originals are optimized with sharp before hitting R2.
    serverActions: { bodySizeLimit: "10mb" },
  },
  // iyzipay self-assembles via fs.readdirSync + dynamic require; sharp is a
  // native module — neither can be bundled, load them from node_modules.
  serverExternalPackages: ["iyzipay", "sharp"],
  images: {
    remotePatterns: r2PublicUrl ? [new URL(`${r2PublicUrl}/**`)] : [],
  },
};

export default nextConfig;
