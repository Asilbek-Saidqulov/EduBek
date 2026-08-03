/**
 * EduBek — audit barrel export.
 */

export {
  type AuditLogEntry,
  type AuditLogger,
} from "@/infra/audit/audit.types";

export {
  auditLogger,
  PrismaAuditLogger,
} from "@/infra/audit/audit.logger";
