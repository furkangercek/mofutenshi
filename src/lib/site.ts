// Canonical site origin (R8: mofutenshi.com). SITE_URL overrides for
// staging/preview deployments; no trailing slash.
export const siteUrl = process.env.SITE_URL ?? "https://mofutenshi.com";
