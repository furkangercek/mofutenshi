import { randomUUID } from "node:crypto";
import { hostname } from "node:os";
import { consumeRateLimit } from "@/lib/rate-limit";

// Server-error reporting to Sentry over its envelope HTTP API (R29.2),
// wired into src/instrumentation.ts onRequestError. Deliberately NOT the
// Sentry SDK: @sentry/nextjs wraps next.config, patches the runtime, and
// ships client JS — a large compatibility surface against Cache Components
// and standalone output for what v1 needs (know when production errors
// happen). The envelope format is stable; swapping this for the SDK later
// only replaces this file. Env-gated like every integration: dormant until
// SENTRY_DSN is set.

type SentryTarget = { endpoint: string; authHeader: string };

function parseDsn(raw: string | undefined): SentryTarget | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const projectId = url.pathname.replaceAll("/", "");
    if (!url.username || !projectId) return null;
    return {
      endpoint: `${url.protocol}//${url.host}/api/${projectId}/envelope/`,
      authHeader: `Sentry sentry_version=7, sentry_client=mofutenshi/1.0, sentry_key=${url.username}`,
    };
  } catch {
    return null;
  }
}

const target = parseDsn(process.env.SENTRY_DSN);

type StackFrame = { function: string; filename: string; lineno: number; colno: number };

// Sentry wants frames oldest-first — the reverse of a V8 stack string.
function parseStack(stack: string | undefined): { frames: StackFrame[] } | undefined {
  const frames: StackFrame[] = [];
  for (const line of stack?.split("\n") ?? []) {
    const match = line.match(/^\s*at (?:(.+?) \()?(.+?):(\d+):(\d+)\)?$/);
    if (!match) continue;
    frames.push({
      function: match[1] ?? "<anonymous>",
      filename: match[2],
      lineno: Number(match[3]),
      colno: Number(match[4]),
    });
  }
  return frames.length > 0 ? { frames: frames.reverse() } : undefined;
}

export type RequestErrorContext = {
  path: string;
  method: string;
  routerKind: string;
  routePath: string;
  routeType: string;
};

// Never throws; awaited by onRequestError, so the send is capped at 3s.
// Request headers are deliberately not forwarded (cookies/PII).
export async function reportServerError(err: unknown, ctx: RequestErrorContext): Promise<void> {
  if (!target) return;
  // A crash loop must not flood the free tier — drop beyond 30 events/min.
  if (!consumeRateLimit("error-report", 30, 60_000)) return;

  const error = err instanceof Error ? err : new Error(String(err));
  const digest =
    typeof err === "object" && err !== null && "digest" in err ? String(err.digest) : undefined;

  const event = {
    event_id: randomUUID().replaceAll("-", ""),
    timestamp: new Date().toISOString(),
    platform: "node",
    level: "error",
    environment: process.env.NODE_ENV ?? "production",
    server_name: hostname(),
    exception: {
      values: [
        {
          type: error.name,
          value: error.message,
          stacktrace: parseStack(error.stack),
        },
      ],
    },
    tags: {
      routerKind: ctx.routerKind,
      routeType: ctx.routeType,
      routePath: ctx.routePath,
      ...(digest ? { digest } : {}),
    },
    request: { url: ctx.path, method: ctx.method },
  };

  const envelope = [
    JSON.stringify({ event_id: event.event_id, sent_at: event.timestamp }),
    JSON.stringify({ type: "event" }),
    JSON.stringify(event),
  ].join("\n");

  try {
    const res = await fetch(target.endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/x-sentry-envelope",
        "x-sentry-auth": target.authHeader,
      },
      body: envelope,
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) console.error(`error report rejected with status ${res.status}`);
  } catch (sendError) {
    console.error("error report send failed", sendError);
  }
}
