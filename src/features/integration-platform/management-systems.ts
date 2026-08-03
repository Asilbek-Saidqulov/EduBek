/** Systems 5-10: OAuth, API Keys, Transformations, Sync, Automation, Triggers. */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { OAuthManagerReport, OAuthClientInfo, ApiKeyManagerReport, ApiKeyInfo, TransformationReport, TransformationMapping, SyncEngineReport, SyncJobInfo, AutomationReport, AutomationRule, TriggerLibraryReport, TriggerDefinition } from "./types";

const log = getLogger("integration-platform");

// System 5 — OAuth Manager
export async function generateOAuthReport(): Promise<OAuthManagerReport> {
  const clients = await repo.fetchOAuthClients(200);
  const infos: OAuthClientInfo[] = clients.map(c => ({
    id: c.id, clientId: c.clientId, name: c.name, description: c.description,
    ownerId: c.ownerId, organizationId: c.organizationId,
    redirectUris: repo.safeParse(c.redirectUris, []), scopes: repo.safeParse(c.scopes, []),
    grantTypes: repo.safeParse(c.grantTypes, []), status: c.status, tokenExpiry: null,
  }));
  const activeCount = infos.filter(c => c.status === "active").length;
  log.info("oauth.report_complete", { total: infos.length, active: activeCount });
  return { generatedAt: new Date().toISOString(), clients: infos, totalClients: infos.length, activeCount, expiringSoon: 0 };
}

// System 6 — API Key Management
export async function generateApiKeyReport(): Promise<ApiKeyManagerReport> {
  const keys = await repo.fetchApiKeys(200);
  const infos: ApiKeyInfo[] = keys.map(k => ({
    id: k.id, keyPrefix: k.keyPrefix, name: k.name, ownerId: k.ownerId,
    organizationId: k.organizationId, scopes: repo.safeParse(k.scopes, []),
    rateLimitPerMin: k.rateLimitPerMin, status: k.status, totalRequests: k.totalRequests,
    lastUsedAt: k.lastUsedAt?.toISOString() ?? null, expiresAt: k.expiresAt?.toISOString() ?? null,
    createdAt: k.createdAt.toISOString(),
  }));
  const activeCount = infos.filter(k => k.status === "active").length;
  const revokedCount = infos.filter(k => k.status === "revoked").length;
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const expiringSoon = infos.filter(k => k.expiresAt && new Date(k.expiresAt) < weekFromNow && k.status === "active").length;
  log.info("apikeys.report_complete", { total: infos.length, active: activeCount, expiring: expiringSoon });
  return { generatedAt: new Date().toISOString(), keys: infos, totalKeys: infos.length, activeCount, expiringSoon, revokedCount };
}

// System 7 — Transformation Engine
const BUILTIN_MAPPINGS: TransformationMapping[] = [
  { id: "google_classroom_to_edubek", name: "Google Classroom → EduBek", sourceSchema: "google.classroom.v1", targetSchema: "edubek.resource.v1", fieldMappings: [{ source: "courseId", target: "classroomId", converter: "direct", defaultValue: null }, { source: "title", target: "title", converter: "direct", defaultValue: null }, { source: "description", target: "description", converter: "direct", defaultValue: "" }], validationRules: ["title required", "courseId required"], conflictResolution: "skip" },
  { id: "canvas_to_edubek", name: "Canvas → EduBek", sourceSchema: "canvas.api.v1", targetSchema: "edubek.resource.v1", fieldMappings: [{ source: "course.id", target: "classroomId", converter: "direct", defaultValue: null }, { source: "assignment.name", target: "title", converter: "direct", defaultValue: null }], validationRules: ["title required"], conflictResolution: "update" },
  { id: "moodle_to_edubek", name: "Moodle → EduBek", sourceSchema: "moodle.api.v1", targetSchema: "edubek.resource.v1", fieldMappings: [{ source: "course.id", target: "classroomId", converter: "direct", defaultValue: null }, { source: "assign.name", target: "title", converter: "direct", defaultValue: null }], validationRules: ["title required"], conflictResolution: "update" },
];
export async function generateTransformationReport(): Promise<TransformationReport> {
  log.info("transformation.report_complete", { mappings: BUILTIN_MAPPINGS.length });
  return { generatedAt: new Date().toISOString(), mappings: BUILTIN_MAPPINGS, totalMappings: BUILTIN_MAPPINGS.length, previewSupported: true };
}

// System 8 — Synchronization Engine
export async function generateSyncReport(): Promise<SyncEngineReport> {
  const logs = await repo.fetchIntegrationSyncLogs(200);
  const jobs: SyncJobInfo[] = logs.map(l => ({
    id: l.id, integrationId: l.integrationId, type: (l.syncType ?? "full") as "full" | "incremental" | "delta",
    status: l.status, startedAt: (l.startedAt ?? l.createdAt).toISOString(),
    completedAt: l.completedAt?.toISOString() ?? null,
    recordsProcessed: l.recordsProcessed ?? 0, recordsFailed: l.recordsFailed ?? 0,
    checkpoint: null, error: l.errorMessage,
  }));
  const totalJobs24h = jobs.length;
  const successCount = jobs.filter(j => j.status === "success").length;
  const successRate = totalJobs24h > 0 ? Math.round((successCount / totalJobs24h) * 100) / 100 : 1;
  const avgDurationMs = 0;
  const pendingCount = jobs.filter(j => j.status === "running" || j.status === "pending").length;
  log.info("sync.report_complete", { jobs: totalJobs24h, successRate });
  return { generatedAt: new Date().toISOString(), recentJobs: jobs, totalJobs24h, successRate, avgDurationMs, pendingCount };
}

// System 9 — Automation Engine
const BUILTIN_AUTOMATIONS: AutomationRule[] = [
  { id: "auto-1", name: "Notify on Assessment Published", trigger: "assessment.published", conditions: ["status == 'published'"], actions: ["send_webhook", "send_email"], schedule: null, enabled: false, simulationMode: true, requiresApproval: true, executionCount: 0, lastExecutedAt: null },
  { id: "auto-2", name: "Sync grades to Google Classroom", trigger: "submission.graded", conditions: ["integration.status == 'connected'"], actions: ["sync_grades"], schedule: null, enabled: false, simulationMode: true, requiresApproval: true, executionCount: 0, lastExecutedAt: null },
  { id: "auto-3", name: "Send weekly summary to Slack", trigger: "scheduled", conditions: [], actions: ["send_slack_message"], schedule: "weekly", enabled: false, simulationMode: true, requiresApproval: true, executionCount: 0, lastExecutedAt: null },
  { id: "auto-4", name: "Auto-enroll students from LMS", trigger: "student.enrolled", conditions: ["source == 'lms'"], actions: ["create_user", "enroll_in_classroom"], schedule: null, enabled: false, simulationMode: true, requiresApproval: true, executionCount: 0, lastExecutedAt: null },
];
export async function generateAutomationReport(): Promise<AutomationReport> {
  log.info("automation.report_complete", { rules: BUILTIN_AUTOMATIONS.length });
  return { generatedAt: new Date().toISOString(), rules: BUILTIN_AUTOMATIONS, totalRules: BUILTIN_AUTOMATIONS.length, enabledCount: 0, simulationCount: BUILTIN_AUTOMATIONS.length, pendingApprovals: 0 };
}

// System 10 — Workflow Trigger Library
const BUILTIN_TRIGGERS: TriggerDefinition[] = [
  { id: "trigger-assessment-published", name: "Assessment Published", category: "assessment", description: "Fires when an assessment is published", eventType: "assessment.published", payloadSchema: { assessmentId: "string", classroomId: "string" } },
  { id: "trigger-quiz-completed", name: "Quiz Completed", category: "assessment", description: "Fires when a student completes a quiz", eventType: "assessment.submitted", payloadSchema: { assessmentId: "string", studentId: "string", score: "number" } },
  { id: "trigger-student-enrolled", name: "Student Enrolled", category: "enrollment", description: "Fires when a student enrolls in a classroom", eventType: "classroom.student_joined", payloadSchema: { classroomId: "string", studentId: "string" } },
  { id: "trigger-teacher-created", name: "Teacher Created", category: "user", description: "Fires when a new teacher account is created", eventType: "user.registered", payloadSchema: { userId: "string", role: "teacher" } },
  { id: "trigger-invoice-generated", name: "Invoice Generated", category: "billing", description: "Fires when an invoice is generated", eventType: "billing.invoice_paid", payloadSchema: { invoiceId: "string", amount: "number" } },
  { id: "trigger-marketplace-purchase", name: "Marketplace Purchase", category: "marketplace", description: "Fires when a marketplace purchase occurs", eventType: "purchase.completed", payloadSchema: { purchaseId: "string", listingId: "string" } },
  { id: "trigger-ai-completed", name: "AI Generation Completed", category: "ai", description: "Fires when an AI generation completes", eventType: "ai.generation_completed", payloadSchema: { traceId: "string", provider: "string" } },
  { id: "trigger-certificate-issued", name: "Certificate Issued", category: "certification", description: "Fires when a certificate is issued", eventType: "certificate.issued", payloadSchema: { certificateId: "string", studentId: "string" } },
  { id: "trigger-research-published", name: "Research Published", category: "research", description: "Fires when research is published", eventType: "publication.published", payloadSchema: { publicationId: "string" } },
  { id: "trigger-webhook-received", name: "Webhook Received", category: "integration", description: "Fires when an inbound webhook is received", eventType: "webhook.received", payloadSchema: { endpoint: "string", payload: "object" } },
  { id: "trigger-manual", name: "Manual Trigger", category: "manual", description: "Manually triggered by a user", eventType: "manual.trigger", payloadSchema: {} },
  { id: "trigger-scheduled", name: "Scheduled Trigger", category: "schedule", description: "Fires on a schedule (cron)", eventType: "schedule.fired", payloadSchema: { schedule: "string" } },
  { id: "trigger-custom", name: "Custom Event", category: "custom", description: "Custom event trigger", eventType: "custom.event", payloadSchema: {} },
];
export async function generateTriggerReport(): Promise<TriggerLibraryReport> {
  const byCategory: Record<string, number> = {};
  for (const t of BUILTIN_TRIGGERS) byCategory[t.category] = (byCategory[t.category] ?? 0) + 1;
  log.info("triggers.report_complete", { total: BUILTIN_TRIGGERS.length });
  return { generatedAt: new Date().toISOString(), triggers: BUILTIN_TRIGGERS, totalTriggers: BUILTIN_TRIGGERS.length, byCategory };
}
