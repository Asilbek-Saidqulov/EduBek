/**
 * EduBek — Game Administration, Operations & Incident Management Platform types.
 * Phase 6G.15: Single source of truth for gaming operations.
 * Owns operational workflows, incident management, maintenance, interventions,
 * operational dashboards, and administrative controls.
 * Never owns gameplay, scoring, matchmaking, progression, rewards, configurations, or analytics.
 */

// System 1 — Operations Control Center
export interface OpsControlCenter {
  liveMatches: number; activeTournaments: number; activeBroadcasts: number;
  liveServices: Array<{ name: string; status: ServiceHealthStatus }>;
  healthSummary: "healthy" | "degraded" | "critical";
  operationalAlerts: number; updatedAt: string;
}

// System 2 — Incident Management
export type IncidentSeverity = "critical" | "high" | "medium" | "low";
export type IncidentStatus = "open" | "investigating" | "identified" | "monitoring" | "resolved" | "closed";
export type IncidentPriority = "p1" | "p2" | "p3" | "p4";
export interface Incident {
  id: string; title: string; description: string; severity: IncidentSeverity;
  priority: IncidentPriority; status: IncidentStatus; owner: string | null;
  createdAt: string; updatedAt: string; resolvedAt: string | null; closedAt: string | null;
  timeline: IncidentTimelineEntry[]; rootCause: string | null;
  resolution: string | null; postmortem: string | null;
  escalationLevel: number; affectedServices: string[];
  correlationId: string; metadata: Record<string, unknown>;
}
export interface IncidentTimelineEntry {
  id: string; timestamp: string; actorId: string; action: string;
  description: string; metadata: Record<string, unknown>;
}
export interface IncidentEscalation {
  id: string; incidentId: string; fromLevel: number; toLevel: number;
  escalatedBy: string; reason: string; timestamp: string;
}

// System 3 — Maintenance Management
export type MaintenanceType = "scheduled" | "emergency" | "partial" | "organization" | "regional";
export type MaintenanceStatus = "scheduled" | "in_progress" | "completed" | "cancelled" | "failed";
export interface MaintenanceWindow {
  id: string; type: MaintenanceType; title: string; description: string;
  status: MaintenanceStatus; startDate: string; endDate: string;
  affectedServices: string[]; organizationId: string | null; region: string | null;
  notificationSent: boolean; createdBy: string; createdAt: string;
  startedAt: string | null; completedAt: string | null;
}
export interface MaintenanceHistory {
  maintenanceId: string; totalWindows: number; completedWindows: number;
  failedWindows: number; cancelledWindows: number; avgDurationMs: number;
}

// System 4 — Emergency Operations
export type EmergencyType = "pause" | "stop" | "announcement" | "global_maintenance" | "organization_isolation" | "service_suspension";
export type EmergencyStatus = "active" | "resolved" | "expired";
export interface EmergencyOperation {
  id: string; type: EmergencyType; status: EmergencyStatus;
  activatedBy: string; activatedAt: string; resolvedAt: string | null;
  resolvedBy: string | null; reason: string; scope: string;
  affectedServices: string[]; recoverySteps: string[]; metadata: Record<string, unknown>;
}

// System 5 — Match Intervention
export type InterventionAction =
  | "pause_match" | "resume_match" | "terminate_match" | "cancel_match"
  | "restart_match" | "freeze_timers" | "disconnect_spectators"
  | "transfer_ownership" | "recover_session" | "force_replay";
export interface MatchIntervention {
  id: string; matchId: string; action: InterventionAction;
  performedBy: string; performedAt: string; reason: string;
  approved: boolean; approvedBy: string | null; correlationId: string;
  beforeState: Record<string, unknown>; afterState: Record<string, unknown>;
  audited: boolean;
}

// System 6 — Operational Playbooks
export type PlaybookCategory =
  | "network_degradation" | "tournament_outage" | "broadcast_failure"
  | "replay_corruption" | "match_recovery" | "database_failover"
  | "redis_degradation" | "notification_outage";
export interface Playbook {
  id: string; name: string; category: PlaybookCategory; description: string;
  steps: PlaybookStep[]; prerequisites: string[]; estimatedDurationMs: number;
  lastUsedAt: string | null; usageCount: number; active: boolean; createdAt: string;
}
export interface PlaybookStep {
  id: string; order: number; action: string; description: string;
  expectedOutcome: string; verificationMethod: string;
}

// System 7 — Administrative Actions
export type AdminScope = "global" | "organization" | "school" | "tournament" | "match" | "player" | "club" | "broadcast";
export interface AdminAction {
  id: string; scope: AdminScope; targetId: string | null;
  action: string; performedBy: string; performedAt: string;
  reason: string; correlationId: string; audited: boolean;
  before: Record<string, unknown>; after: Record<string, unknown>;
}

// System 8 — Service Health Platform
export type ServiceHealthStatus = "healthy" | "degraded" | "unhealthy" | "maintenance" | "unknown";
export type ServiceName =
  | "engine" | "broadcast" | "replay" | "competitive" | "progression"
  | "social" | "liveops" | "inventory" | "configuration" | "intelligence";
export interface ServiceHealth {
  service: ServiceName; status: ServiceHealthStatus;
  lastCheckedAt: string; issues: string[]; uptime: number;
  responseTimeMs: number; metadata: Record<string, unknown>;
}

// System 9 — Operational Alerts
export type AlertSeverity = "critical" | "high" | "medium" | "low" | "informational";
export type AlertStatus = "active" | "acknowledged" | "assigned" | "resolved" | "expired";
export interface OperationalAlert {
  id: string; severity: AlertSeverity; status: AlertStatus;
  title: string; description: string; source: string;
  createdAt: string; acknowledgedAt: string | null; acknowledgedBy: string | null;
  assignedTo: string | null; resolvedAt: string | null; resolvedBy: string | null;
  escalationLevel: number; incidentId: string | null;
  history: AlertHistoryEntry[];
}
export interface AlertHistoryEntry {
  id: string; timestamp: string; action: string; actorId: string; note: string;
}

// System 10 — Global Announcement Platform
export type AnnouncementType = "emergency_banner" | "maintenance_message" | "tournament_announcement" | "organization_notice" | "regional_notice";
export type AnnouncementAudience = "all" | "organization" | "school" | "region" | "tournament" | "broadcast";
export interface Announcement {
  id: string; type: AnnouncementType; audience: AnnouncementAudience;
  title: string; message: string; targetId: string | null;
  scheduledAt: string; publishedAt: string | null; expiresAt: string | null;
  active: boolean; createdBy: string; createdAt: string;
}

// System 11 — Operational Audit
export interface AuditEntry {
  id: string; actorId: string; action: string; scope: AdminScope;
  targetId: string | null; timestamp: string; reason: string;
  before: Record<string, unknown>; after: Record<string, unknown>;
  correlationId: string; incidentId: string | null; approvalId: string | null;
}

// System 12 — Administrative Dashboard
export interface OpsDashboard {
  incidents: { open: number; critical: number; high: number; resolved24h: number };
  maintenance: { scheduled: number; inProgress: number; completed24h: number };
  alerts: { active: number; critical: number; acknowledged: number };
  health: Array<{ service: ServiceName; status: ServiceHealthStatus }>;
  announcements: { active: number; scheduled: number };
  interventions: { total24h: number; pending: number };
  stats: { totalIncidents: number; avgResolutionTimeMs: number; slaCompliance: number };
  updatedAt: string;
}

// System 13 — Operational Analytics
export interface OpsAnalytics {
  incidentFrequency: number; avgResolutionTimeMs: number;
  maintenanceCount: number; interventionFrequency: number;
  recoverySuccessRate: number; slaCompliance: number;
  incidentsBySeverity: Record<IncidentSeverity, number>;
  incidentsByService: Record<string, number>;
  mttrMs: number; mttcMs: number;
}

// System 15 — Developer Integration
export interface OpsDeveloperIntegration {
  publicAPIs: Array<{ path: string; method: string; description: string; authRequired: boolean }>;
  extensionHooks: Array<{ id: string; name: string; triggerEvent: string }>;
  sdkMetadata: { version: string; language: string; docsUrl: string };
}

// System 14 — Event Bus Bridge
export type OpsEventType =
  | "IncidentCreated" | "MaintenanceStarted" | "MaintenanceFinished"
  | "EmergencyActivated" | "EmergencyResolved"
  | "OperationalAlertCreated" | "AnnouncementPublished";
