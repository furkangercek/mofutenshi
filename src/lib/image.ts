const r2PublicUrl = process.env.R2_PUBLIC_URL;

// Returns null when the image cannot be served (no R2 configured yet, or
// seed placeholder keys) — callers render the gradient placeholder instead.
export function imageUrl(key: string | null | undefined): string | null {
  if (!key || !r2PublicUrl) return null;
  return `${r2PublicUrl}/${key}`;
}
