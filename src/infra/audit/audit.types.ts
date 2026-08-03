/**
 * EduBek — audit log types.
 *
 * The audit log is an append-only record of every meaningful state
 * transition in the platform. Producers do NOT write to the audit log
 * directly — they publish a `DomainEvent`, and the audit listeners
 * (see `src/infra/listeners/audit-listeners.ts`) translate that event into
 * an `AuditLogEntry` and hand it to the `AuditLogger`.
 *
 * This indirection means a single producer call can fan out to multiple
 * audit effects (e.g. both writing to the DB and forwarding to a SIEM)
 * without the producer knowing about either.
 */

export interface AuditLogEntry {
  /** User id of the actor. May be undefined for system-generated events. */
  actorId?: string;
  /** "user" | "system" | "api" — defaults to "user" when actorId is set, else "system". */
  actorType?: "user" | "system" | "api";
  /** Stable action string, e.g. "user.registered" or "marketplace.listing_published". */
  action: string;
  /** Optional entity type, e.g. "organization", "listing", "wallet". */
  entityType?: string;
  /** Optional entity id, e.g. the created org's id. */
  entityId?: string;
  /** "success" | "failure" | "pending". Defaults to "success". */
  status?: "success" | "failure" | "pending";
  /** Arbitrary structured payload, JSON-serialized by the logger. */
  metadata?: Record<string, unknown>;
  /** Request IP when known. */
  ipAddress?: string;
  /** User-Agent when known. */
  userAgent?: string;
}

export interface AuditLogger {
  log(entry: AuditLogEntry): Promise<void>;
}
