import { NextResponse, type NextRequest } from "next/server";

export class ApiError extends Error {
  statusCode: number;
  code?: string;
  details?: any;
  messageKey?: string;

  constructor(statusCode: number, message: string, details?: any, messageKey?: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
    this.messageKey = messageKey;
    this.code = code;
  }
}

export function badRequest(message: string, details?: any, messageKey?: string) {
  return new ApiError(400, message, details, messageKey, "BAD_REQUEST");
}

export function unauthorized(message = "Unauthorized", details?: any, messageKey = "errors.unauthorized") {
  return new ApiError(401, message, details, messageKey, "UNAUTHORIZED");
}

export function forbidden(message = "Forbidden", details?: any, messageKey = "errors.forbidden") {
  return new ApiError(403, message, details, messageKey, "FORBIDDEN");
}

export function notFound(message = "Not found", details?: any, messageKey = "errors.notFound") {
  return new ApiError(404, message, details, messageKey, "NOT_FOUND");
}

export function conflict(message = "Conflict", details?: any, messageKey = "errors.conflict") {
  return new ApiError(409, message, details, messageKey, "CONFLICT");
}

export function internalError(message = "Internal Server Error", details?: any, messageKey = "errors.internal") {
  return new ApiError(500, message, details, messageKey, "INTERNAL_ERROR");
}

export function zodIssueToMessageKey(issue: any): string {
  if (!issue) return "errors.invalidInput";
  return `errors.validation.${issue.code || "invalid"}`;
}

export function withErrorHandler(
  handler: (req: NextRequest, ctx?: any) => Promise<Response | NextResponse>,
) {
  return async (req: NextRequest, ctx?: any) => {
    try {
      return await handler(req, ctx);
    } catch (err: any) {
      if (err instanceof ApiError) {
        return NextResponse.json(
          {
            error: {
              code: err.code || "API_ERROR",
              message: err.message,
              details: err.details,
              messageKey: err.messageKey,
            },
          },
          { status: err.statusCode },
        );
      }

      console.error("[Unhandled API Error]", err);
      return NextResponse.json(
        {
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: err?.message || "Internal server error",
          },
        },
        { status: 500 },
      );
    }
  };
}
