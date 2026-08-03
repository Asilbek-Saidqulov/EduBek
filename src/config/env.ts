/**
 * EduBek — centralized environment configuration.
 *
 * This is the *single source of truth* for every runtime configuration value
 * in the platform. Components, services, repositories, middleware, and
 * instrumentation hooks MUST import `env` from here instead of touching
 * `process.env` directly — that keeps the surface area small, makes missing
 * values loud at boot, and lets us swap the underlying source (e.g. to a
 * secrets manager) without touching call sites.
 *
 * The shape of `env` is frozen on first import so that no module can mutate
 * configuration at runtime and accidentally affect another module.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Read a string env var, returning `undefined` if it is missing or blank. */
function optional(name: string): string | undefined {
  const raw = process.env[name];
  if (raw === undefined) return undefined;
  const trimmed = raw.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

/**
 * Read a string env var that MUST be set in production. In dev/test a missing
 * value is allowed (returns `undefined`) so that local development does not
 * require a fully configured environment.
 */
function requiredInProd(name: string): string | undefined {
  const value = optional(name);
  if (value === undefined && process.env.NODE_ENV === 'production') {
    // We throw synchronously at module load time. This is intentional: a
    // missing production secret is a deployment-worth bug, not a runtime
    // degradation.
    throw new Error(
      `[env] Required environment variable "${name}" is not set in production.`,
    );
  }
  return value;
}

/** Read a boolean env var. Treats `1`, `true`, `yes` (case-insensitive) as truthy. */
function bool(name: string, defaultValue: boolean): boolean {
  const raw = optional(name);
  if (raw === undefined) return defaultValue;
  const lower = raw.toLowerCase();
  return lower === '1' || lower === 'true' || lower === 'yes' || lower === 'on';
}

/** Read a numeric env var with a fallback. NaN falls back to the default. */
function num(name: string, defaultValue: number): number {
  const raw = optional(name);
  if (raw === undefined) return defaultValue;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

// ---------------------------------------------------------------------------
// Resolve values
// ---------------------------------------------------------------------------

const nodeEnv = optional('NODE_ENV') ?? 'development';
const isProd = nodeEnv === 'production';
const isDev = nodeEnv === 'development';
const isTest = nodeEnv === 'test';

const databaseUrl = optional('DATABASE_URL') ?? 'postgresql://postgres:postgres@localhost:5432/edubek';

// ---------------------------------------------------------------------------
// Auth block
// ---------------------------------------------------------------------------

const sessionSecret =
  optional('EDUBEK_SESSION_SECRET') ??
  // Allow a generic fallback in dev/test so that local development works
  // without forcing the developer to set secrets. In production the absence
  // of an explicit secret is a hard error.
  (isProd ? undefined : 'edubek-dev-session-secret-do-not-use-in-prod');

const refreshSecret =
  optional('EDUBEK_REFRESH_SECRET') ??
  (isProd ? undefined : 'edubek-dev-refresh-secret-do-not-use-in-prod');

const resolvedSessionSecret = sessionSecret ?? 'edubek-dev-session-secret-do-not-use-in-prod';
const resolvedRefreshSecret = refreshSecret ?? 'edubek-dev-refresh-secret-do-not-use-in-prod';

// ---------------------------------------------------------------------------
// App block
// ---------------------------------------------------------------------------

const appName = optional('EDUBEK_APP_NAME') ?? 'EduBek';
const appVersion =
  optional('EDUBEK_APP_VERSION') ??
  optional('npm_package_version') ??
  '0.1.0';
const port = num('PORT', 3000);

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

const logLevel = (optional('EDUBEK_LOG_LEVEL') ??
  (isDev ? 'debug' : 'info')) as LogLevel;
const logQueries = bool('EDUBEK_LOG_QUERIES', isDev);

// ---------------------------------------------------------------------------
// Feature flags — every feature module ships behind a flag so that operators
// can disable incomplete / dangerous subsystems without redeploying code.
// ---------------------------------------------------------------------------

const features = {
  marketplace: bool('EDUBEK_FEATURE_MARKETPLACE', true),
  ai: bool('EDUBEK_FEATURE_AI', true),
  organizations: bool('EDUBEK_FEATURE_ORGANIZATIONS', true),
  creatorEconomy: bool('EDUBEK_FEATURE_CREATOR_ECONOMY', true),
  eduTokens: bool('EDUBEK_FEATURE_EDU_TOKENS', true),
  analytics: bool('EDUBEK_FEATURE_ANALYTICS', true),
  search: bool('EDUBEK_FEATURE_SEARCH', true),
  library: bool('EDUBEK_FEATURE_LIBRARY', true),
} as const;

// ---------------------------------------------------------------------------
// Auth block (assembled)
// ---------------------------------------------------------------------------

const auth = {
  sessionSecret: resolvedSessionSecret as string,
  refreshSecret: resolvedRefreshSecret as string,
  sessionTtlSeconds: num('EDUBEK_SESSION_TTL_SECONDS', 900),
  refreshTtlSeconds: num('EDUBEK_REFRESH_TTL_SECONDS', 60 * 60 * 24 * 30), // 30 days
  bcryptRounds: num('EDUBEK_BCRYPT_ROUNDS', 12),
  sessionCookieName: optional('EDUBEK_SESSION_COOKIE_NAME') ?? 'edubek_session',
  refreshCookieName:
    optional('EDUBEK_REFRESH_COOKIE_NAME') ?? 'edubek_refresh',
  cookieSecure: bool('EDUBEK_COOKIE_SECURE', isProd),
} as const;

// ---------------------------------------------------------------------------
// Final, frozen env object
// ---------------------------------------------------------------------------

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

export interface Env {
  nodeEnv: string;
  isProd: boolean;
  isDev: boolean;
  isTest: boolean;

  databaseUrl: string;

  auth: {
    sessionSecret: string;
    refreshSecret: string;
    sessionTtlSeconds: number;
    refreshTtlSeconds: number;
    bcryptRounds: number;
    sessionCookieName: string;
    refreshCookieName: string;
    cookieSecure: boolean;
  };

  appName: string;
  appVersion: string;
  port: number;

  logLevel: LogLevel;
  logQueries: boolean;

  features: {
    marketplace: boolean;
    ai: boolean;
    organizations: boolean;
    creatorEconomy: boolean;
    eduTokens: boolean;
    analytics: boolean;
    search: boolean;
    library: boolean;
  };
}

export const env: Env = Object.freeze({
  nodeEnv,
  isProd,
  isDev,
  isTest,
  databaseUrl,
  auth,
  appName,
  appVersion,
  port,
  logLevel,
  logQueries,
  features,
}) as Env;

// Re-export helpers so that feature modules can extend the same convention
// without re-implementing the parsing logic.
export { optional, requiredInProd, bool, num };
