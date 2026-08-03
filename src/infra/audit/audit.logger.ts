/**
 * EduBek — Prisma-backed audit logger.
 *
 * Writes every `AuditLogEntry` to the `AuditLog` table. The logger is
 * *never* allowed to throw: audit failures are surfaced via the structured
 * logger but never propagated to the caller, because a failed audit write
 * must not roll back the business operation that triggered it.
 */

import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import type { AuditLogEntry, AuditLogger } from "@/infra/audit/audit.types";

const log = getLogger("audit");

export class PrismaAuditLogger implements AuditLogger {
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const actorType = entry.actorType ?? (entry.actorId ? "user" : "system");
      await db.auditLog.create({
        data: {
          actorId: entry.actorId ?? null,
          actorType,
          action: entry.action,
          entityType: entry.entityType ?? null,
          entityId: entry.entityId ?? null,
          status: entry.status ?? "success",
          metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
          ipAddress: entry.ipAddress ?? null,
          userAgent: entry.userAgent ?? null,
        },
      });
    } catch (err) {
      // CRITICAL: never re-throw. Audit failures must not break the
      // business operation that triggered them. Log loudly so an operator
      // notices, then move on.
      log.error("audit.write_failed", {
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        actorId: entry.actorId,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
    }
  }
}

export const auditLogger: AuditLogger = new PrismaAuditLogger();
