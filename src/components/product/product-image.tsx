import Image from "next/image";

// Fills its (relative-positioned) parent. Falls back to a pastel gradient
// while no real image can be served (docs/DESIGN.md, placeholder imagery).
// `src` is resolved server-side (lib/image.ts) — client components cannot
// read the server-only R2_PUBLIC_URL env.
export function ProductImage({
  src,
  alt,
  sizes,
  className = "",
  priority = false,
}: {
  src: string | null;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  if (!src) {
    return (
      <div
        aria-hidden
        className={`from-primary/50 via-ghost to-accent/40 absolute inset-0 bg-linear-to-br ${className}`}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={`object-cover ${className}`}
    />
  );
}
