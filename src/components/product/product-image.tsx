import Image from "next/image";
import { imageUrl } from "@/lib/image";

// Fills its (relative-positioned) parent. Falls back to a pastel gradient
// while no real image can be served (docs/DESIGN.md, placeholder imagery).
export function ProductImage({
  imageKey,
  alt,
  sizes,
  className = "",
  priority = false,
}: {
  imageKey: string | null;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  const src = imageUrl(imageKey);

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
