import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

// Cloudflare R2 over the S3 API. Like iyzico/Google OAuth, the integration
// stays dormant until the owner provisions credentials (.env.example).
const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET;

export const r2Enabled = Boolean(
  accountId && accessKeyId && secretAccessKey && bucket && process.env.R2_PUBLIC_URL,
);

let client: S3Client | null = null;

function r2Client(): S3Client {
  if (!r2Enabled) throw new Error("R2 is not configured");
  client ??= new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
  });
  return client;
}

export async function r2Put(key: string, body: Buffer, contentType: string): Promise<void> {
  await r2Client().send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }),
  );
}

export async function r2Delete(key: string): Promise<void> {
  await r2Client().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
