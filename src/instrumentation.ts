import type { Instrumentation } from "next";
import { reportServerError } from "@/lib/error-reporting";

// Server errors from renders, route handlers, and server actions land here
// (Next instrumentation hook) and are forwarded to Sentry when SENTRY_DSN is
// set. Next's own console error logging is unaffected.
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  await reportServerError(err, {
    path: request.path,
    method: request.method,
    routerKind: context.routerKind,
    routePath: context.routePath,
    routeType: context.routeType,
  });
};
