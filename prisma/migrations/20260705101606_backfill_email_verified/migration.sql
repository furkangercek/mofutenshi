-- R11: verification arrives after these accounts were created, so existing
-- users are grandfathered as verified (fresh databases are unaffected).
UPDATE "User" SET "emailVerified" = NOW() WHERE "emailVerified" IS NULL;
