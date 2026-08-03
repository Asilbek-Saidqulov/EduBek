/** Systems 3, 4, 7, 10 — Maintenance, Emergency, Admin Actions, Announcements. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import { storeMaintenance, getMaintenance, getAllMaintenance, storeEmergency, getEmergency, getAllEmergencies, storeAdminAction, getAdminActions, storeAnnouncement, getAnnouncement, getAllAnnouncements } from "./repository";
import type { MaintenanceWindow, MaintenanceType, MaintenanceStatus, EmergencyOperation, EmergencyType, EmergencyStatus, AdminAction, AdminScope, Announcement, AnnouncementType, AnnouncementAudience } from "./types";

const log = getLogger("game-ops.maintenance");

// ===== System 3 — Maintenance Management =====
export function createMaintenance(input: {
  type: MaintenanceType; title: string; description: string;
  startDate: string; endDate: string; affectedServices?: string[];
  organizationId?: string | null; region?: string | null; createdBy: string;
}): MaintenanceWindow {
  const mw: MaintenanceWindow = {
    id: randomUUID(), type: input.type, title: input.title, description: input.description,
    status: "scheduled", startDate: input.startDate, endDate: input.endDate,
    affectedServices: input.affectedServices ?? [], organizationId: input.organizationId ?? null,
    region: input.region ?? null, notificationSent: false, createdBy: input.createdBy,
    createdAt: new Date().toISOString(), startedAt: null, completedAt: null,
  };
  storeMaintenance(mw);
  log.info("maintenance.created", { id: mw.id, type: input.type });
  return mw;
}

export function getMaintenanceById(id: string): MaintenanceWindow | null { return getMaintenance(id); }
export function listMaintenance(status?: MaintenanceStatus, type?: MaintenanceType): MaintenanceWindow[] {
  let all = getAllMaintenance();
  if (status) all = all.filter(m => m.status === status);
  if (type) all = all.filter(m => m.type === type);
  return all;
}

export function startMaintenance(id: string): MaintenanceWindow | null {
  const m = getMaintenance(id);
  if (!m || m.status !== "scheduled") return null;
  m.status = "in_progress"; m.startedAt = new Date().toISOString();
  storeMaintenance(m);
  log.info("maintenance.started", { id });
  return m;
}

export function completeMaintenance(id: string): MaintenanceWindow | null {
  const m = getMaintenance(id);
  if (!m || m.status !== "in_progress") return null;
  m.status = "completed"; m.completedAt = new Date().toISOString();
  storeMaintenance(m);
  return m;
}

export function cancelMaintenance(id: string, reason: string): MaintenanceWindow | null {
  const m = getMaintenance(id);
  if (!m || m.status === "completed") return null;
  m.status = "cancelled";
  storeMaintenance(m);
  return m;
}

export function markNotificationSent(id: string): MaintenanceWindow | null {
  const m = getMaintenance(id);
  if (!m) return null;
  m.notificationSent = true;
  storeMaintenance(m);
  return m;
}

// ===== System 4 — Emergency Operations =====
export function activateEmergency(input: {
  type: EmergencyType; activatedBy: string; reason: string;
  scope: string; affectedServices?: string[]; recoverySteps?: string[];
}): EmergencyOperation {
  const e: EmergencyOperation = {
    id: randomUUID(), type: input.type, status: "active",
    activatedBy: input.activatedBy, activatedAt: new Date().toISOString(),
    resolvedAt: null, resolvedBy: null, reason: input.reason, scope: input.scope,
    affectedServices: input.affectedServices ?? [], recoverySteps: input.recoverySteps ?? [],
    metadata: {},
  };
  storeEmergency(e);
  log.warn("emergency.activated", { id: e.id, type: input.type, scope: input.scope });
  return e;
}

export function getEmergencyById(id: string): EmergencyOperation | null { return getEmergency(id); }
export function listEmergencies(status?: EmergencyStatus): EmergencyOperation[] {
  const all = getAllEmergencies();
  return status ? all.filter(e => e.status === status) : all;
}
export function getActiveEmergencies(): EmergencyOperation[] { return getAllEmergencies().filter(e => e.status === "active"); }

export function resolveEmergency(id: string, resolvedBy: string): EmergencyOperation | null {
  const e = getEmergency(id);
  if (!e || e.status !== "active") return null;
  e.status = "resolved"; e.resolvedAt = new Date().toISOString(); e.resolvedBy = resolvedBy;
  storeEmergency(e);
  log.info("emergency.resolved", { id });
  return e;
}

export function supportsAllEmergencyTypes(): EmergencyType[] { return ["pause", "stop", "announcement", "global_maintenance", "organization_isolation", "service_suspension"]; }
export function supportsAllMaintenanceTypes(): MaintenanceType[] { return ["scheduled", "emergency", "partial", "organization", "regional"]; }

// ===== System 7 — Administrative Actions =====
export function recordAdminAction(input: {
  scope: AdminScope; targetId?: string | null; action: string;
  performedBy: string; reason: string; correlationId?: string;
  before?: Record<string, unknown>; after?: Record<string, unknown>;
}): AdminAction {
  const a: AdminAction = {
    id: randomUUID(), scope: input.scope, targetId: input.targetId ?? null,
    action: input.action, performedBy: input.performedBy, performedAt: new Date().toISOString(),
    reason: input.reason, correlationId: input.correlationId ?? randomUUID(),
    audited: true, before: input.before ?? {}, after: input.after ?? {},
  };
  storeAdminAction(a);
  log.info("admin.action", { scope: input.scope, action: input.action, performedBy: input.performedBy });
  return a;
}

export function listAdminActions(scope?: AdminScope): AdminAction[] {
  const all = getAdminActions();
  return scope ? all.filter(a => a.scope === scope) : all;
}
export function supportsAllAdminScopes(): AdminScope[] { return ["global", "organization", "school", "tournament", "match", "player", "club", "broadcast"]; }

// ===== System 10 — Global Announcement Platform =====
export function createAnnouncement(input: {
  type: AnnouncementType; audience: AnnouncementAudience; title: string; message: string;
  targetId?: string | null; scheduledAt?: string; expiresAt?: string | null; createdBy: string;
}): Announcement {
  const a: Announcement = {
    id: randomUUID(), type: input.type, audience: input.audience,
    title: input.title, message: input.message, targetId: input.targetId ?? null,
    scheduledAt: input.scheduledAt ?? new Date().toISOString(),
    publishedAt: null, expiresAt: input.expiresAt ?? null,
    active: false, createdBy: input.createdBy, createdAt: new Date().toISOString(),
  };
  storeAnnouncement(a);
  return a;
}

export function getAnnouncementById(id: string): Announcement | null { return getAnnouncement(id); }
export function listAnnouncements(activeOnly?: boolean): Announcement[] {
  const all = getAllAnnouncements();
  return activeOnly ? all.filter(a => a.active) : all;
}

export function publishAnnouncement(id: string): Announcement | null {
  const a = getAnnouncement(id);
  if (!a || a.active) return null;
  a.active = true; a.publishedAt = new Date().toISOString();
  storeAnnouncement(a);
  log.info("announcement.published", { id, type: a.type });
  return a;
}

export function expireAnnouncement(id: string): Announcement | null {
  const a = getAnnouncement(id);
  if (!a || !a.active) return null;
  a.active = false;
  storeAnnouncement(a);
  return a;
}

export function supportsAllAnnouncementTypes(): AnnouncementType[] { return ["emergency_banner", "maintenance_message", "tournament_announcement", "organization_notice", "regional_notice"]; }
export function supportsAllAnnouncementAudiences(): AnnouncementAudience[] { return ["all", "organization", "school", "region", "tournament", "broadcast"]; }
