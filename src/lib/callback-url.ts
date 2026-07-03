// Relative-path allowlist so a crafted callbackUrl can never bounce the user
// to another origin after login.
export function safeCallbackPath(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.startsWith("/") && !value.startsWith("//")) return value;
  return fallback;
}
