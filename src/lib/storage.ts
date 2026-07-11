import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { r2Delete, r2Enabled, r2Put } from "@/lib/r2";

// R28 image storage: R2 when configured, otherwise an EXPLICIT local-disk
// dev fallback via LOCAL_UPLOAD_DIR (e.g. "local-uploads", gitignored).
// Files are served by the /uploads/[...key] route handler — NOT from
// public/, which output:"standalone" snapshots at build time. Production
// must never set LOCAL_UPLOAD_DIR: the container disk is ephemeral and the
// files bypass the CDN.

const localDir = process.env.LOCAL_UPLOAD_DIR?.replaceAll("\\", "/").replace(/\/+$/, "");

export const localUploadsEnabled = Boolean(localDir) && !r2Enabled;
export const uploadsEnabled = r2Enabled || localUploadsEnabled;

// The browser-facing path prefix the route handler answers on.
export const localUploadPublicPrefix = localUploadsEnabled ? "/uploads" : null;

// Resolves a storage key inside the local dir; rejects anything that would
// escape it. Keys are server-generated, but the route handler also feeds
// request paths through this.
export function localFilePath(key: string): string | null {
  if (!localUploadsEnabled) return null;
  const base = path.resolve(process.cwd(), localDir!);
  const file = path.resolve(base, key);
  if (!file.startsWith(base + path.sep)) return null;
  return file;
}

export async function storagePut(key: string, body: Buffer, contentType: string): Promise<void> {
  if (r2Enabled) return r2Put(key, body, contentType);
  const file = localFilePath(key);
  if (!file) throw new Error("image storage is not configured");
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, body);
}

export async function storageDelete(key: string): Promise<void> {
  if (r2Enabled) return r2Delete(key);
  const file = localFilePath(key);
  if (!file) throw new Error("image storage is not configured");
  await unlink(file).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
  });
}
