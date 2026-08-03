/**
 * EduBek — Correlation ID middleware.
 *
 * Every incoming HTTP request gets a correlation ID. If the client
 * sends one (via `X-Correlation-Id`), we reuse it; otherwise we
 * generate one. The ID is:
 *
 *   1. Set on the request headers for downstream services to read.
 *   2. Included in every log line for that request.
 *   3. Returned to the client in the `X-Correlation-Id` response header.
 *
 * The Socket.IO layer also reads this ID from the handshake headers
 * and tags every socket event with it.
 *
 * Usage in a route:
 *   export const GET = withCorrelationId(withErrorHandler(async (req) => { ... }));
 *
 * Or, to read the current correlation ID inside a service:
 *   const cid = getCorrelationId(); // returns string | undefined
 */
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { getLogger } from "@/lib/logger";

const log = getLogger("correlation");

export const CORRELATION_ID_HEADER = "x-correlation-id";

// AsyncLocalStorage lets us propagate the correlation ID through the
// entire async call chain without passing it as a parameter.
import { AsyncLocalStorage } from "node:async_hooks";

const correlationStorage = new AsyncLocalStorage<string>();

/**
 * Returns the correlation ID for the current request, or undefined
 * if called outside a request context.
 */
export function getCorrelationId(): string | undefined {
  return correlationStorage.getStore();
}

/**
 * Generate a new correlation ID (UUID v4, truncated for readability).
 */
export function generateCorrelationId(): string {
  return randomUUID().split("-")[0]!; // first segment is enough for log grepping
}

/**
 * Wrap a route handler with correlation ID propagation.
 * Usage:
 *   export const GET = withCorrelationId(withErrorHandler(async (req) => { ... }));
 */
export function withCorrelationId<
  TParams extends Record<string, string | string[]> = Record<string, never>,
>(
  handler: (req: NextRequest, ctx: any) => Promise<NextResponse>,
): (req: NextRequest, ctx: any) => Promise<NextResponse> {
  return async (req: NextRequest, ctx: any) => {
    const cid = req.headers.get(CORRELATION_ID_HEADER) ?? generateCorrelationId();
    // Set it on the request so downstream code can read it via headers()
    req.headers.set(CORRELATION_ID_HEADER, cid);

    return correlationStorage.run(cid, async () => {
      const response = await handler(req, ctx);
      response.headers.set(CORRELATION_ID_HEADER, cid);
      return response;
    });
  };
}

/**
 * Read the correlation ID from the Next.js headers() context.
 * Use this in Server Components or route handlers that don't use
 * `withCorrelationId`.
 */
export async function getCorrelationIdFromHeaders(): Promise<string | undefined> {
  const h = await headers();
  return h.get(CORRELATION_ID_HEADER) ?? undefined;
}
