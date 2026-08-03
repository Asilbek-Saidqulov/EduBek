/**
 * EduBek — structured logger.
 *
 * Pretty-prints in development for readability, emits one-line JSON in
 * production for ingestion by log aggregators (Loki, Datadog, …), and stays
 * silent in tests so that test output is not polluted.
 *
 * The implementation does NOT depend on `pino` so that the Edge runtime and
 * the instrumentation hook can import it without bundler issues. A
 * `requestLogger()` helper is provided that prefers `pino-http` when present
 * but degrades gracefully to a no-op middleware when the package is absent.
 *
 * Every logger is a *child* of the root singleton. Use `getLogger(module)` to
 * get a child logger that automatically tags every line with `module: <name>`
 * — this is how we attribute log lines back to a specific subsystem during
 * post-mortems.
 */

import { createRequire } from "node:module";
import { env } from "@/config/env";

// `createRequire` lets us lazily resolve CommonJS modules from ESM. The
// logger is server-only (the Edge middleware imports neither this file nor
// anything that re-exports it), so importing `node:module` is safe here.
// We still guard the call so that a sandbox without `createRequire` falls
// back to the inline logger instead of crashing.
const nodeRequire: NodeRequire | null = (() => {
  try {
    if (typeof createRequire !== "function") return null;
    // `import.meta.url` is the canonical ESM anchor. Fall back to a
    // file:// URL when running under a bundler that strips it.
    const url =
      typeof import.meta !== "undefined" && import.meta.url
        ? import.meta.url
        : "file:///edubek/logger.ts";
    return createRequire(url);
  } catch {
    return null;
  }
})();

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

/** Arbitrary structured context attached to every log line from a logger. */
export interface LogContext {
  [key: string]: unknown;
}

export interface Logger {
  /** Create a child logger that merges the given context into every line. */
  child(context: LogContext): Logger;
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: Number.POSITIVE_INFINITY,
};

const ROOT_LEVEL: LogLevel = env.logLevel;

function shouldLog(level: LogLevel): boolean {
  return LEVEL_WEIGHT[level] >= LEVEL_WEIGHT[ROOT_LEVEL];
}

function safeValue(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }
  if (typeof value === "function") {
    return "[Function]";
  }
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (typeof value === "object" && value !== null) {
    try {
      // Detect cycles / unserializable payloads and replace them with a
      // placeholder instead of letting JSON.stringify throw.
      JSON.stringify(value);
      return value;
    } catch {
      return "[Unserializable]";
    }
  }
  return value;
}

function sanitizeContext(context: LogContext): LogContext {
  const out: LogContext = {};
  for (const [key, value] of Object.entries(context)) {
    out[key] = safeValue(value);
  }
  return out;
}

function mergeContext(
  base: LogContext,
  extra: LogContext | undefined,
): LogContext {
  if (!extra || Object.keys(extra).length === 0) return base;
  return { ...base, ...extra };
}

function formatPretty(
  level: LogLevel,
  message: string,
  context: LogContext,
): string {
  const ts = new Date().toISOString();
  const ctxStr =
    Object.keys(context).length === 0 ? "" : " " + JSON.stringify(context);
  return `${ts} ${level.toUpperCase().padEnd(5)} ${message}${ctxStr}`;
}

function formatJson(
  level: LogLevel,
  message: string,
  context: LogContext,
): string {
  const payload = {
    time: new Date().toISOString(),
    level,
    msg: message,
    ...context,
  };
  try {
    return JSON.stringify(payload);
  } catch {
    // Last-resort: drop the unserializable context entirely.
    return JSON.stringify({
      time: payload.time,
      level,
      msg: message,
      note: "log context was unserializable and was dropped",
    });
  }
}

function emit(level: LogLevel, message: string, context: LogContext): void {
  if (!shouldLog(level)) return;

  // `silent` short-circuits above, but be explicit for the test runtime too.
  if (env.isTest && level !== "error" && level !== "warn") return;

  const safeCtx = sanitizeContext(context);
  const line = env.isProd
    ? formatJson(level, message, safeCtx)
    : formatPretty(level, message, safeCtx);

  // Use the Node/Edge built-in stream APIs directly. We deliberately avoid
  // importing `pino` here to keep the logger Edge-safe.
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

class RootLogger implements Logger {
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  child(context: LogContext): Logger {
    return new RootLogger(mergeContext(this.context, context));
  }

  debug(message: string, context?: LogContext): void {
    emit("debug", message, mergeContext(this.context, context));
  }

  info(message: string, context?: LogContext): void {
    emit("info", message, mergeContext(this.context, context));
  }

  warn(message: string, context?: LogContext): void {
    emit("warn", message, mergeContext(this.context, context));
  }

  error(message: string, context?: LogContext): void {
    emit("error", message, mergeContext(this.context, context));
  }
}

// ---------------------------------------------------------------------------
// Singletons + factory
// ---------------------------------------------------------------------------

/** Root logger. Prefer `getLogger(module)` over using this directly. */
export const logger: Logger = new RootLogger();

/**
 * Return a child logger tagged with `module: <name>`. Safe to call from any
 * runtime (Node, Edge, instrumentation). Subsequent calls with the same name
 * return fresh instances — that's intentional, child loggers are cheap.
 */
export function getLogger(module: string): Logger {
  return logger.child({ module });
}

// ---------------------------------------------------------------------------
// Request logger middleware factory
// ---------------------------------------------------------------------------

/**
 * HTTP request logger middleware factory.
 *
 * Prefers `pino-http` when it is resolvable at runtime; otherwise falls back
 * to a thin inline implementation that emits a structured line per request
 * through the root logger. The fallback exists because (a) the Edge runtime
 * cannot load Node-only `pino-http`, and (b) the project does not list
 * `pino-http` as a hard dependency in Phase R0.
 *
 * The middleware signature is intentionally generic so it can wrap Next.js
 * request handlers, Express apps, or any (req, res, next) style stack.
 */
type RequestLike = {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
};

type ResponseLike = {
  status?: number;
  statusCode?: number;
};

export interface RequestLoggerOptions {
  /** Tag every line with a module name. Defaults to "http". */
  module?: string;
  /** Redact these header names from the log payload. */
  redactHeaders?: string[];
}

// Resolve `pino-http` once per process. Failures (missing package, Edge
// runtime, bundler stripped it) leave `pinoHttpMiddleware` as `null` and
// the inline fallback is used instead.
let pinoHttpMiddleware:
  | ((req: unknown, res: unknown, next?: () => void) => void)
  | null = null;
let pinoHttpResolved = false;
function resolvePinoHttp(): void {
  if (pinoHttpResolved) return;
  pinoHttpResolved = true;
  try {
    if (nodeRequire) {
      const mod = nodeRequire("pino-http");
      pinoHttpMiddleware =
        (mod?.default ?? mod?.httpLogger ?? mod) ?? null;
    }
  } catch {
    pinoHttpMiddleware = null;
  }
}

export function requestLogger(options: RequestLoggerOptions = {}) {
  const moduleName = options.module ?? "http";
  const log = getLogger(moduleName);
  const redact = new Set(
    (options.redactHeaders ?? ["authorization", "cookie"]).map((h) =>
      h.toLowerCase(),
    ),
  );

  resolvePinoHttp();
  if (pinoHttpMiddleware) {
    try {
      return pinoHttpMiddleware;
    } catch {
      // If pino-http throws during construction, fall through to the inline
      // implementation.
    }
  }

  return function edubekRequestLogger(
    req: RequestLike,
    res: ResponseLike,
    next?: () => void,
  ): void {
    const method = req.method ?? "GET";
    const url = req.url ?? "/";
    const headers: Record<string, unknown> = {};
    if (req.headers) {
      for (const [key, value] of Object.entries(req.headers)) {
        if (redact.has(key.toLowerCase())) {
          headers[key] = "[redacted]";
        } else {
          headers[key] = value;
        }
      }
    }
    log.debug("http.request", { method, url, headers });
    if (typeof next === "function") {
      next();
    }
    const status = res.status ?? res.statusCode ?? 200;
    log.info("http.response", { method, url, status });
  };
}
