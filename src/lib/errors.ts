/**
 * EduBek — centralized error handling for HTTP routes.
 *
 * The pattern across the codebase:
 *   1. Route handlers are thin: parse input, call a service, return JSON.
 *   2. Services throw `HttpError` (or one of the convenience factories) to
 *      signal any user-visible failure. They never build NextResponse objects.
 *   3. The `withErrorHandler` wrapper catches those errors, normalizes them,
 *      and emits a single, predictable envelope:
 *
 *        { "error": { "code": "NOT_FOUND", "message": "...", "details": ... } }
 *
 * This means the frontend has exactly one shape to deal with, and any new
 * route gets correct error handling for free.
 */

import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getLogger } from "@/lib/logger";

const log = getLogger("errors");

// ---------------------------------------------------------------------------
// Error code catalogue
// ---------------------------------------------------------------------------

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "AI_GENERATION_FAILED"
  | "AI_INVALID_RESPONSE"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  CONFLICT: 409,
  AI_GENERATION_FAILED: 502,
  AI_INVALID_RESPONSE: 502,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

// ---------------------------------------------------------------------------
// HttpError
// ---------------------------------------------------------------------------

export interface HttpErrorDetails {
  [key: string]: unknown;
}

/**
 * Application-level error. Throw this from services / repositories / route
 * handlers to signal any condition the caller needs to react to.
 *
 * `status` is derived from `code` and is kept in sync via the constructor.
 * `details` is an optional structured payload (e.g. Zod field errors) that
 * is forwarded to the client when present.
 *
 * Phase 4E.1 i18n: `messageKey` and `params` are optional fields that
 * allow the frontend to translate the error message using the user's
 * locale. The English `message` remains as a backward-compatible
 * fallback. Existing callers that don't pass `messageKey` continue to
 * work exactly as before.
 */
export class HttpError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly details?: HttpErrorDetails;
  /** Translation key for i18n (e.g. "errors.notFound"). */
  readonly messageKey?: string;
  /** Interpolation params for the translation key. */
  readonly params?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message: string,
    options: {
      details?: HttpErrorDetails;
      cause?: unknown;
      messageKey?: string;
      params?: Record<string, unknown>;
    } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "HttpError";
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = options.details;
    this.messageKey = options.messageKey;
    this.params = options.params;
  }
}

// ---------------------------------------------------------------------------
// Convenience factories
// ---------------------------------------------------------------------------

export function badRequest(
  message: string,
  details?: HttpErrorDetails,
  messageKey?: string,
  params?: Record<string, unknown>,
): HttpError {
  return new HttpError("VALIDATION_ERROR", message, { details, messageKey, params });
}

export function unauthorized(
  message = "Unauthorized",
  messageKey = "errors.unauthorized",
): HttpError {
  return new HttpError("UNAUTHORIZED", message, { messageKey });
}

export function forbidden(
  message = "Forbidden",
  messageKey = "errors.forbidden",
): HttpError {
  return new HttpError("FORBIDDEN", message, { messageKey });
}

export function notFound(
  message = "Not found",
  messageKey = "errors.notFound",
): HttpError {
  return new HttpError("NOT_FOUND", message, { messageKey });
}

export function conflict(
  message: string,
  details?: HttpErrorDetails,
  messageKey?: string,
  params?: Record<string, unknown>,
): HttpError {
  return new HttpError("CONFLICT", message, { details, messageKey, params });
}

// ---------------------------------------------------------------------------
// Route context (Next.js 16)
// ---------------------------------------------------------------------------

/**
 * Next.js 16 routes receive their dynamic params via a *Promise*. This helper
 * keeps the type signature readable in route files:
 *
 *   export const POST = withErrorHandler<{ slug: string }>(
 *     async (req, ctx) => {
 *       const { slug } = await ctx.params;
 *       ...
 *     }
 *   );
 */
export interface RouteContext<
  TParams extends Record<string, string | string[]> = Record<string, never>,
> {
  params: Promise<TParams>;
}

// ---------------------------------------------------------------------------
// Standardized error envelope
// ---------------------------------------------------------------------------

export interface ErrorEnvelope {
  error: {
    code: ErrorCode;
    message: string;
    /** Translation key for i18n (Phase 4E.1). */
    messageKey?: string;
    /** Interpolation params for the translation key. */
    params?: Record<string, unknown>;
    details?: HttpErrorDetails;
  };
}

function envelope(
  code: ErrorCode,
  message: string,
  details?: HttpErrorDetails,
  messageKey?: string,
  params?: Record<string, unknown>,
): ErrorEnvelope {
  const result: ErrorEnvelope = {
    error: { code, message },
  };
  if (messageKey) result.error.messageKey = messageKey;
  if (params) result.error.params = params;
  if (details) result.error.details = details;
  return result;
}

// ---------------------------------------------------------------------------
// withErrorHandler
// ---------------------------------------------------------------------------

type RouteHandler<
  TParams extends Record<string, string | string[]> = Record<string, never>,
> = (req: NextRequest, context: RouteContext<TParams>) => Promise<NextResponse>;

/**
 * Wrap a Next.js 16 route handler with centralized error handling.
 *
 * The handler is free to throw `HttpError`, throw a `ZodError` (which is
 * mapped to VALIDATION_ERROR with the full field path), or throw any other
 * Error (mapped to INTERNAL_ERROR). Successful responses are passed through
 * untouched.
 *
 * Use this on *every* exported route handler so that error responses are
 * consistent across the entire API surface.
 */
export function withErrorHandler<
  TParams extends Record<string, string | string[]> = Record<string, never>,
>(
  handler: RouteHandler<TParams>,
): RouteHandler<TParams> {
  return async function wrapped(req, context) {
    try {
      return await handler(req, context);
    } catch (err) {
      if (err instanceof HttpError) {
        if (err.status >= 500) {
          log.error("route.http_error", {
            code: err.code,
            status: err.status,
            message: err.message,
            messageKey: err.messageKey,
          });
        } else {
          log.warn("route.http_error", {
            code: err.code,
            status: err.status,
            message: err.message,
            messageKey: err.messageKey,
          });
        }
        return NextResponse.json(
          envelope(err.code, err.message, err.details, err.messageKey, err.params),
          { status: err.status },
        );
      }

      if (err instanceof ZodError || (err as any)?.issues?.length) {
        const zodErr = err as any;
        const details: HttpErrorDetails = {
          issues: (zodErr.issues || []).map((issue: any) => ({
            path: Array.isArray(issue.path) ? issue.path.join(".") : String(issue.path),
            message: issue.message,
            code: issue.code,
            // Phase 4E.3: map Zod issue codes to backend validation messageKeys
            messageKey: zodIssueToMessageKey(issue),
          })),
        };
        log.warn("route.validation_error", { details });
        return NextResponse.json(
          envelope("VALIDATION_ERROR", "Request validation failed", details, "errors.validationError"),
          { status: 400 },
        );
      }

      // Unknown error — never leak internals to the client.
      const message =
        err instanceof Error ? err.message : "An unknown error occurred";
      log.error("route.internal_error", {
        message,
        name: err instanceof Error ? err.name : typeof err,
        stack: err instanceof Error ? err.stack : undefined,
      });
      return NextResponse.json(
        envelope("INTERNAL_ERROR", "Internal server error", undefined, "errors.internalError"),
        { status: 500 },
      );
    }
  };
}

// ---------------------------------------------------------------------------
// Phase 4E.3 — Zod issue → messageKey mapping
// ---------------------------------------------------------------------------

/**
 * Map a Zod issue to a backend validation messageKey.
 * The frontend can use this key to look up a localized message.
 */
export function zodIssueToMessageKey(issue: import("zod").ZodIssue): string {
  const path = issue.path.join(".");
  // Map common Zod issue codes to validation messageKeys
  switch (issue.code) {
    case "invalid_type":
      return "backend.validation.required";
    case "invalid_format":
      // Zod v4 uses invalid_format for string validations (email, url, etc.)
      if (path.includes("email")) return "backend.validation.emailInvalid";
      return "backend.validation.required";
    case "too_small":
      if (path.includes("password")) return "backend.validation.passwordTooShort";
      if (path.includes("username")) return "backend.validation.usernameTooShort";
      return "backend.validation.required";
    case "too_big":
      if (path.includes("email")) return "backend.validation.emailTooLong";
      if (path.includes("password")) return "backend.validation.passwordTooLong";
      if (path.includes("username")) return "backend.validation.usernameTooLong";
      if (path.includes("name")) return "backend.validation.nameTooLong";
      return "backend.validation.required";
    case "custom":
      // Custom validation messages — check for known patterns
      if (issue.message.includes("uppercase")) return "backend.validation.passwordNoUppercase";
      if (issue.message.includes("digit")) return "backend.validation.passwordNoDigit";
      if (issue.message.includes("letters")) return "backend.validation.usernameInvalidChars";
      if (issue.message.includes("required")) return "backend.validation.required";
      return "backend.validation.required";
    default:
      return "backend.validation.required";
  }
}
