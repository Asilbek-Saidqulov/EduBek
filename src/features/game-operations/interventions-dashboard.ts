/** Systems 1, 5, 6, 8, 11, 12, 13, 15, 16 — Control Center, Interventions, Playbooks, Health, Audit, Dashboard, Analytics, Developer, Admin API. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import { storeIntervention, getInterventions, storePlaybook, getPlaybook, getAllPlaybooks, storeServiceHealth, getServiceHealth, getAllServiceHealth, storeAudit, getAuditEntries, getAllIncidents, getAllMaintenance, getAllAlerts, getAllAnnouncements, getAllEmergencies } from "./repository";
import type { MatchIntervention, InterventionAction, Playbook, PlaybookCategory, PlaybookStep, ServiceHealth, ServiceName, ServiceHealthStatus, AuditEntry, AdminScope, OpsControlCenter, OpsDashboard, OpsAnalytics, OpsDeveloperIntegration, IncidentSeverity } from "./types";

const log = getLogger("game-ops.dashboard");

// ===== System 1 — Operations Control Center =====
export function generateControlCenter(): OpsControlCenter {
  const health = getAllServiceHealth();
  const criticalCount = health.filter(h => h.status === "unhealthy" || h.status === "critical" as never).length;
  const healthSummary = criticalCount > 2 ? "critical" : criticalCount > 0 ? "degraded" : "healthy";
  return {
    liveMatches: 0, activeTournaments: 0, activeBroadcasts: 0,
    liveServices: health.map(h => ({ name: h.service, status: h.status })),
    healthSummary: healthSummary as "healthy" | "degraded" | "critical",
    operationalAlerts: getAllAlerts().filter(a => a.status === "active").length,
    updatedAt: new Date().toISOString(),
  };
}

// ===== System 5 — Match Intervention =====
export function performIntervention(input: {
  matchId: string; action: InterventionAction; performedBy: string;
  reason: string; approved?: boolean; approvedBy?: string | null;
  beforeState?: Record<string, unknown>; afterState?: Record<string, unknown>;
}): MatchIntervention {
  const intervention: MatchIntervention = {
    id: randomUUID(), matchId: input.matchId, action: input.action,
    performedBy: input.performedBy, performedAt: new Date().toISOString(),
    reason: input.reason, approved: input.approved ?? false,
    approvedBy: input.approvedBy ?? null, correlationId: randomUUID(),
    beforeState: input.beforeState ?? {}, afterState: input.afterState ?? {},
    audited: true,
  };
  storeIntervention(intervention);
  // Auto-create audit entry
  recordAudit({ actorId: input.performedBy, action: `intervention:${input.action}`, scope: "match", targetId: input.matchId, reason: input.reason, correlationId: intervention.correlationId, before: input.beforeState ?? {}, after: input.afterState ?? {} });
  log.info("intervention.performed", { matchId: input.matchId, action: input.action });
  return intervention;
}

export function getInterventionsForMatch(matchId: string): MatchIntervention[] { return getInterventions(matchId); }
export function supportsAllInterventionActions(): InterventionAction[] {
  return ["pause_match", "resume_match", "terminate_match", "cancel_match", "restart_match", "freeze_timers", "disconnect_spectators", "transfer_ownership", "recover_session", "force_replay"];
}

// ===== System 6 — Operational Playbooks =====
export function createPlaybook(input: {
  name: string; category: PlaybookCategory; description: string;
  steps?: Array<Omit<PlaybookStep, "id">>; prerequisites?: string[]; estimatedDurationMs?: number;
}): Playbook {
  const pb: Playbook = {
    id: randomUUID(), name: input.name, category: input.category, description: input.description,
    steps: (input.steps ?? []).map((s, i) => ({ ...s, id: randomUUID(), order: s.order ?? i + 1 })),
    prerequisites: input.prerequisites ?? [], estimatedDurationMs: input.estimatedDurationMs ?? 60000,
    lastUsedAt: null, usageCount: 0, active: true, createdAt: new Date().toISOString(),
  };
  storePlaybook(pb);
  return pb;
}

export function getPlaybookById(id: string): Playbook | null { return getPlaybook(id); }
export function listPlaybooks(category?: PlaybookCategory): Playbook[] {
  const all = getAllPlaybooks();
  return category ? all.filter(p => p.category === category) : all;
}

export function executePlaybook(id: string): Playbook | null {
  const pb = getPlaybook(id);
  if (!pb || !pb.active) return null;
  pb.usageCount += 1; pb.lastUsedAt = new Date().toISOString();
  return pb;
}

export function deactivatePlaybook(id: string): Playbook | null {
  const pb = getPlaybook(id);
  if (!pb) return null;
  pb.active = false;
  return pb;
}

export function supportsAllPlaybookCategories(): PlaybookCategory[] {
  return ["network_degradation", "tournament_outage", "broadcast_failure", "replay_corruption", "match_recovery", "database_failover", "redis_degradation", "notification_outage"];
}

// ===== System 8 — Service Health Platform =====
export function recordServiceHealth(input: {
  service: ServiceName; status: ServiceHealthStatus; issues?: string[];
  uptime?: number; responseTimeMs?: number; metadata?: Record<string, unknown>;
}): ServiceHealth {
  const h: ServiceHealth = {
    service: input.service, status: input.status,
    lastCheckedAt: new Date().toISOString(), issues: input.issues ?? [],
    uptime: input.uptime ?? 100, responseTimeMs: input.responseTimeMs ?? 0,
    metadata: input.metadata ?? {},
  };
  storeServiceHealth(h);
  return h;
}

export function getServiceHealthRecord(service: string): ServiceHealth | null { return getServiceHealth(service); }
export function listServiceHealth(): ServiceHealth[] { return getAllServiceHealth(); }
export function supportsAllServiceNames(): ServiceName[] {
  return ["engine", "broadcast", "replay", "competitive", "progression", "social", "liveops", "inventory", "configuration", "intelligence"];
}

// ===== System 11 — Operational Audit =====
export function recordAudit(input: {
  actorId: string; action: string; scope: AdminScope; targetId?: string | null;
  reason: string; correlationId?: string; incidentId?: string | null; approvalId?: string | null;
  before?: Record<string, unknown>; after?: Record<string, unknown>;
}): AuditEntry {
  const entry: AuditEntry = {
    id: randomUUID(), actorId: input.actorId, action: input.action, scope: input.scope,
    targetId: input.targetId ?? null, timestamp: new Date().toISOString(), reason: input.reason,
    before: input.before ?? {}, after: input.after ?? {},
    correlationId: input.correlationId ?? randomUUID(),
    incidentId: input.incidentId ?? null, approvalId: input.approvalId ?? null,
  };
  storeAudit(entry);
  return entry;
}

export function listAuditEntries(): AuditEntry[] { return getAuditEntries(); }

// ===== System 12 — Administrative Dashboard =====
export function generateOpsDashboard(): OpsDashboard {
  const incidents = getAllIncidents();
  const maintenance = getAllMaintenance();
  const alerts = getAllAlerts();
  const announcements = getAllAnnouncements();
  const health = getAllServiceHealth();
  const resolved24h = incidents.filter(i => i.resolvedAt && Date.now() - new Date(i.resolvedAt!).getTime() < 86_400_000).length;
  const completed24h = maintenance.filter(m => m.completedAt && Date.now() - new Date(m.completedAt).getTime() < 86_400_000).length;
  const resolutionTimes = incidents.filter(i => i.resolvedAt).map(i => new Date(i.resolvedAt!).getTime() - new Date(i.createdAt).getTime());
  const avgResolution = resolutionTimes.length > 0 ? Math.round(resolutionTimes.reduce((s, t) => s + t, 0) / resolutionTimes.length) : 0;
  return {
    incidents: { open: incidents.filter(i => i.status !== "closed" && i.status !== "resolved").length, critical: incidents.filter(i => i.severity === "critical" && i.status !== "closed").length, high: incidents.filter(i => i.severity === "high" && i.status !== "closed").length, resolved24h },
    maintenance: { scheduled: maintenance.filter(m => m.status === "scheduled").length, inProgress: maintenance.filter(m => m.status === "in_progress").length, completed24h },
    alerts: { active: alerts.filter(a => a.status === "active").length, critical: alerts.filter(a => a.severity === "critical" && a.status !== "resolved").length, acknowledged: alerts.filter(a => a.status === "acknowledged").length },
    health: health.map(h => ({ service: h.service, status: h.status })),
    announcements: { active: announcements.filter(a => a.active).length, scheduled: announcements.filter(a => !a.active && !a.publishedAt).length },
    interventions: { total24h: 0, pending: 0 },
    stats: { totalIncidents: incidents.length, avgResolutionTimeMs: avgResolution, slaCompliance: 95 },
    updatedAt: new Date().toISOString(),
  };
}

// ===== System 13 — Operational Analytics =====
export function generateOpsAnalytics(): OpsAnalytics {
  const incidents = getAllIncidents();
  const maintenance = getAllMaintenance();
  const resolutionTimes = incidents.filter(i => i.resolvedAt).map(i => new Date(i.resolvedAt!).getTime() - new Date(i.createdAt).getTime());
  const avgResolution = resolutionTimes.length > 0 ? Math.round(resolutionTimes.reduce((s, t) => s + t, 0) / resolutionTimes.length) : 0;
  const bySeverity: Record<IncidentSeverity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const i of incidents) bySeverity[i.severity]++;
  const byService: Record<string, number> = {};
  for (const i of incidents) for (const s of i.affectedServices) byService[s] = (byService[s] ?? 0) + 1;
  return {
    incidentFrequency: incidents.length, avgResolutionTimeMs: avgResolution,
    maintenanceCount: maintenance.length, interventionFrequency: 0,
    recoverySuccessRate: incidents.length > 0 ? (incidents.filter(i => i.status === "resolved" || i.status === "closed").length / incidents.length) : 1,
    slaCompliance: 95, incidentsBySeverity: bySeverity, incidentsByService: byService,
    mttrMs: avgResolution, mttcMs: 0,
  };
}

// ===== System 15 — Developer Integration =====
export function getDeveloperIntegration(): OpsDeveloperIntegration {
  return {
    publicAPIs: [
      { path: "/api/game-operations/status", method: "GET", description: "Operational status", authRequired: true },
      { path: "/api/game-operations/health", method: "GET", description: "Service health", authRequired: true },
      { path: "/api/game-operations/incidents", method: "GET", description: "Incidents", authRequired: true },
      { path: "/api/game-operations/maintenance", method: "GET", description: "Maintenance windows", authRequired: true },
      { path: "/api/game-operations/alerts", method: "GET", description: "Operational alerts", authRequired: true },
      { path: "/api/game-operations/announcements", method: "GET", description: "Announcements", authRequired: true },
      { path: "/api/game-operations/interventions", method: "GET", description: "Match interventions", authRequired: true },
      { path: "/api/game-operations/dashboard", method: "GET", description: "Ops dashboard", authRequired: true },
      { path: "/api/game-operations/audit", method: "GET", description: "Audit trail", authRequired: true },
    ],
    extensionHooks: [
      { id: "hook_incident_created", name: "On Incident Created", triggerEvent: "IncidentCreated" },
      { id: "hook_emergency_activated", name: "On Emergency Activated", triggerEvent: "EmergencyActivated" },
      { id: "hook_maintenance_started", name: "On Maintenance Started", triggerEvent: "MaintenanceStarted" },
    ],
    sdkMetadata: { version: "1.0.0", language: "TypeScript", docsUrl: "https://docs.edubek.dev/operations" },
  };
}

// ===== System 16 — Administration API =====
export function getStatus() {
  return {
    platform: "game-operations",
    version: "1.0.0",
    activeIncidents: getAllIncidents().filter(i => i.status !== "closed" && i.status !== "resolved").length,
    activeEmergencies: getAllEmergencies().filter(e => e.status === "active").length,
    activeMaintenance: getAllMaintenance().filter(m => m.status === "in_progress").length,
    activeAlerts: getAllAlerts().filter(a => a.status === "active").length,
    dashboard: generateOpsDashboard(),
  };
}
