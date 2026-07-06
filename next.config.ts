import type { NextConfig } from "next";

// R2_PUBLIC_URL is unset until the bucket exists; images then fall back to
// the gradient placeholder (src/components/ui/product-image.tsx).
const r2PublicUrl = process.env.R2_PUBLIC_URL;

const nextConfig: NextConfig = {
  // Minimal production server for the Docker image (docs/DEPLOY.md).
  output: "standalone",
  cacheComponents: true,
  experimental: {
    // Admin image uploads post the original file to a server action;
    // originals are optimized with sharp before hitting R2.
    serverActions: { bodySizeLimit: "10mb" },
  },
  // iyzipay self-assembles via fs.readdirSync + dynamic require; sharp is a
  // native module; pdfkit reads its font data files with fs — none can be
  // bundled, load them from node_modules.
  serverExternalPackages: ["iyzipay", "sharp", "pdfkit"],
  // Invoice PDFs embed the Inter TTFs via fs at request time; without this
  // the standalone output would not carry them.
  outputFileTracingIncludes: {
    "/*": ["src/assets/fonts/*.ttf"],
  },
  images: {
    remotePatterns: r2PublicUrl ? [new URL(`${r2PublicUrl}/**`)] : [],
  },
};

export default nextConfig;
