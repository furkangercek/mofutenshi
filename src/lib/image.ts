import { existsSync } from "node:fs";
import { localFilePath, localUploadPublicPrefix } from "@/lib/storage";

const r2PublicUrl = process.env.R2_PUBLIC_URL;

// Returns null when the image cannot be served (no storage configured, seed
// placeholder keys, file missing from the local-dev dir) — callers render the
// gradient placeholder instead. Local-dev fallback (R28) serves via /uploads.
export function imageUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  if (r2PublicUrl) return `${r2PublicUrl}/${key}`;
  if (localUploadPublicPrefix) {
    // Seed keys and hand-deleted files have no local file — placeholder, not
    // a broken <img>. Sync check is fine: server-only, small cached catalog.
    const file = localFilePath(key);
    if (!file || !existsSync(file)) return null;
    return `${localUploadPublicPrefix}/${key}`;
  }
  return null;
}
