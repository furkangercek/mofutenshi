// Nightly DB backup uploader (docs/DEPLOY.md). Reads a pg_dump custom-format
// archive from stdin and stores it in R2, pruning old backups. Runs inside
// the app container, where the traced @aws-sdk/client-s3 is available:
//
//   docker exec <db> pg_dump -U mofutenshi -Fc mofutenshi \
//     | docker exec -i <app> node scripts/backup-db.mjs
//
// Env: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
// (same as the app), optional BACKUP_KEEP (default 14).

import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET;
const keep = Number(process.env.BACKUP_KEEP ?? 14);

if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
  console.error(
    "backup-db: R2 env vars missing (R2_ACCOUNT_ID/ACCESS_KEY_ID/SECRET_ACCESS_KEY/BUCKET)",
  );
  process.exit(1);
}

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);
const body = Buffer.concat(chunks);
if (body.length < 1024) {
  console.error(`backup-db: dump on stdin is suspiciously small (${body.length} bytes), aborting`);
  process.exit(1);
}

const client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

const stamp = new Date().toISOString().replace(/[:]/g, "-").slice(0, 16);
const key = `backups/mofutenshi-${stamp}.dump`;
await client.send(
  new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: "application/octet-stream",
  }),
);
console.log(`backup-db: uploaded ${key} (${Math.round(body.length / 1024)} KB)`);

const listed = await client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: "backups/" }));
const backups = (listed.Contents ?? []).map((o) => o.Key).sort();
const stale = backups.slice(0, Math.max(0, backups.length - keep));
for (const staleKey of stale) {
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: staleKey }));
  console.log(`backup-db: pruned ${staleKey}`);
}
