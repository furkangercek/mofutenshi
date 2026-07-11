import { readFile } from "node:fs/promises";
import { NextResponse, type NextRequest } from "next/server";
import { localFilePath, localUploadsEnabled } from "@/lib/storage";

// R28 local-dev image serving: streams LOCAL_UPLOAD_DIR files at /uploads/*.
// Dead (404) whenever the local fallback is off — with R2 configured, image
// URLs point at the bucket and never hit this route.

const MIME_BY_EXT: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  avif: "image/avif",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  if (!localUploadsEnabled) return new NextResponse(null, { status: 404 });

  const { key } = await params;
  const file = localFilePath(key.join("/"));
  const ext = key[key.length - 1]?.split(".").pop()?.toLowerCase() ?? "";
  const mime = MIME_BY_EXT[ext];
  if (!file || !mime) return new NextResponse(null, { status: 404 });

  try {
    const body = await readFile(file);
    return new NextResponse(new Uint8Array(body), {
      headers: {
        "content-type": mime,
        "cache-control": "public, max-age=0, must-revalidate",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
