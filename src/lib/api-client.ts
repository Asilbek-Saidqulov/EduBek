/**
 * Lightweight API helpers for client-side fetch against EduBek's
 * `{ error: { code, message, details } }` envelope.
 *
 * Centralizes:
 *   - `credentials: "same-origin"` (cookies)
 *   - JSON content-type + body stringification
 *   - 401 → throw a typed `UnauthenticatedError` so callers can redirect
 *     to /login instead of showing a generic toast.
 *   - Non-2xx → throw `ApiError` with the parsed envelope.
 */
"use client";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: Record<string, unknown> | undefined;
  readonly issues: Array<{ path: string; message: string }> | undefined;

  constructor(opts: {
    status: number;
    code: string;
    message: string;
    details?: Record<string, unknown>;
    issues?: Array<{ path: string; message: string }>;
  }) {
    super(opts.message);
    this.name = "ApiError";
    this.status = opts.status;
    this.code = opts.code;
    this.details = opts.details;
    this.issues = opts.issues;
  }
}

export class UnauthenticatedError extends ApiError {
  constructor() {
    super({ status: 401, code: "UNAUTHORIZED", message: "Authentication required" });
    this.name = "UnauthenticatedError";
  }
}

interface ApiEnvelope {
  error?: {
    code?: string;
    message?: string;
    messageKey?: string;
    params?: Record<string, unknown>;
    details?: Record<string, unknown>;
    issues?: Array<{ path: string; message: string }>;
  };
}

async function request<T>(
  url: string,
  init: RequestInit & { method: string },
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers,
      credentials: "same-origin",
    });
  } catch (err) {
    throw new ApiError({
      status: 0,
      code: "NETWORK_ERROR",
      message: (err as Error).message || "Network error",
    });
  }
  if (res.status === 401) throw new UnauthenticatedError();
  // 204 No Content — return empty object so callers can chain.
  if (res.status === 204) return {} as T;
  const isJson = (res.headers.get("Content-Type") ?? "").includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : null;
  if (!res.ok) {
    const err = (payload as ApiEnvelope | null)?.error;
    throw new ApiError({
      status: res.status,
      code: err?.code ?? "INTERNAL_ERROR",
      message: err?.message ?? `Request failed (${res.status})`,
      details: err?.details,
      issues: err?.issues,
    });
  }
  return (payload ?? ({} as unknown)) as T;
}

export const api = {
  get: <T>(url: string) => request<T>(url, { method: "GET" }),
  post: <T>(url: string, body?: unknown) =>
    request<T>(url, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  patch: <T>(url: string, body?: unknown) =>
    request<T>(url, {
      method: "PATCH",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  put: <T>(url: string, body?: unknown) =>
    request<T>(url, {
      method: "PUT",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  del: <T>(url: string) => request<T>(url, { method: "DELETE" }),
};
