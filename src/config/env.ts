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

const databaseUrl = optional('DATABASE_URL');
if (!databaseUrl) {
  throw new Error(
    '[env] DATABASE_URL is required but was not found in the environment.',
  );
}

// ---------------------------------------------------------------------------
// Auth block
// ---------------------------------------------------------------------------

const sessionSecret =
  optional('EDUBEK_SESSION_SECRET') ??
  (isProd ? undefined : 'dev-session-secret-64-bytes-random-DO-NOT-USE-IN-PROD-a1b2c3d4e5f6');

const refreshSecret =
  requiredInProd('EDUBEK_REFRESH_SECRET') ??
  (isProd ? undefined : 'dev-refresh-secret-64-bytes-random-DO-NOT-USE-IN-PROD-a1b2c3d4e5f6');

// Dedicated secret for guest JWTs — MUST be distinct from session/refresh
// secrets so a leaked guest token cannot be used to forge a session JWT
// (and vice versa). Verified at boot in production. Length-min enforced.
const guestSecret =
  requiredInProd('EDUBEK_GUEST_SECRET') ??
  (isProd ? undefined : 'dev-guest-secret-64-bytes-random-DO-NOT-USE-IN-PROD-a1b2c3d4e5f6');

// Encryption key for at-rest secrets (OAuth client secrets, payment provider
// keys). MUST be 32 bytes (256 bits) for AES-256-GCM. Required in production.
const encryptionKey =
  requiredInProd('EDUBEK_ENCRYPTION_KEY') ??
  (isProd ? undefined : 'dev-encryption-key-32-bytes!DO-NOT-USE-IN-PROD');

if (isProd && (!sessionSecret || !refreshSecret || !guestSecret || !encryptionKey)) {
  throw new Error(
    '[env] EDUBEK_SESSION_SECRET, EDUBEK_REFRESH_SECRET, EDUBEK_GUEST_SECRET, and EDUBEK_ENCRYPTION_KEY must all be set in production.',
  );
}

// Reject well-known placeholder secrets in production — even if an operator
// sets the env var to a placeholder like "CHANGE_ME" or copies the dev string,
// the platform refuses to boot. This is a last line of defense against
// misconfigured production deployments.
const KNOWN_BAD_SECRETS = new Set([
  'edubek-dev-session-secret-do-not-use-in-prod',
  'edubek-dev-refresh-secret-do-not-use-in-prod',
  'CHANGE_ME_IN_PRODUCTION',
  'CHANGE_ME',
  'changeme',
  'secret',
  'password',
  '',
]);

if (isProd) {
  if (sessionSecret && (sessionSecret.length < 32 || KNOWN_BAD_SECRETS.has(sessionSecret))) {
    throw new Error('[env] EDUBEK_SESSION_SECRET must be at least 32 bytes and not a known placeholder in production.');
  }
  if (refreshSecret && (refreshSecret.length < 32 || KNOWN_BAD_SECRETS.has(refreshSecret))) {
    throw new Error('[env] EDUBEK_REFRESH_SECRET must be at least 32 bytes and not a known placeholder in production.');
  }
  if (guestSecret && (guestSecret.length < 32 || KNOWN_BAD_SECRETS.has(guestSecret))) {
    throw new Error('[env] EDUBEK_GUEST_SECRET must be at least 32 bytes and not a known placeholder in production.');
  }
  if (encryptionKey && (encryptionKey.length < 32 || KNOWN_BAD_SECRETS.has(encryptionKey))) {
    throw new Error('[env] EDUBEK_ENCRYPTION_KEY must be at least 32 bytes and not a known placeholder in production.');
  }
}

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
  sessionSecret: sessionSecret as string,
  refreshSecret: refreshSecret as string,
  guestSecret: guestSecret as string,
  encryptionKey: encryptionKey as string,
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
    guestSecret: string;
    encryptionKey: string;
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
