/** Systems 2, 9 — Incident Management + Operational Alerts. */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import { storeIncident, getIncident, getAllIncidents, storeEscalation, getEscalations, storeAlert, getAlert, getAllAlerts } from "./repository";
import type { Incident, IncidentSeverity, IncidentStatus, IncidentPriority, IncidentTimelineEntry, IncidentEscalation, OperationalAlert, AlertSeverity, AlertStatus, AlertHistoryEntry } from "./types";

const log = getLogger("game-ops.incident");

// ===== System 2 — Incident Management =====
export function createIncident(input: {
  title: string; description: string; severity: IncidentSeverity;
  priority?: IncidentPriority; owner?: string | null; affectedServices?: string[];
  correlationId?: string; metadata?: Record<string, unknown>;
}): Incident {
  const now = new Date().toISOString();
  const incident: Incident = {
    id: randomUUID(), title: input.title, description: input.description,
    severity: input.severity, priority: input.priority ?? "p3", status: "open",
    owner: input.owner ?? null, createdAt: now, updatedAt: now,
    resolvedAt: null, closedAt: null, timeline: [], rootCause: null,
    resolution: null, postmortem: null, escalationLevel: 0,
    affectedServices: input.affectedServices ?? [], correlationId: input.correlationId ?? randomUUID(),
    metadata: input.metadata ?? {},
  };
  const entry: IncidentTimelineEntry = { id: randomUUID(), timestamp: now, actorId: "system", action: "created", description: "Incident created", metadata: {} };
  incident.timeline.push(entry);
  storeIncident(incident);
  log.info("incident.created", { id: incident.id, severity: input.severity });
  return incident;
}

export function getIncidentById(id: string): Incident | null { return getIncident(id); }
export function listIncidents(status?: IncidentStatus, severity?: IncidentSeverity): Incident[] {
  let all = getAllIncidents();
  if (status) all = all.filter(i => i.status === status);
  if (severity) all = all.filter(i => i.severity === severity);
  return all;
}

const VALID_INCIDENT_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  open: ["investigating", "resolved", "closed"],
  investigating: ["identified", "monitoring", "resolved", "closed"],
  identified: ["monitoring", "resolved", "closed"],
  monitoring: ["resolved", "closed", "investigating"],
  resolved: ["closed", "investigating"],
  closed: [],
};

export function transitionIncident(incidentId: string, toStatus: IncidentStatus, actorId: string, description: string): Incident | null {
  const inc = getIncident(incidentId);
  if (!inc) return null;
  if (!VALID_INCIDENT_TRANSITIONS[inc.status]?.includes(toStatus)) return null;
  const now = new Date().toISOString();
  const entry: IncidentTimelineEntry = { id: randomUUID(), timestamp: now, actorId, action: `transition:${toStatus}`, description, metadata: {} };
  inc.timeline.push(entry);
  inc.status = toStatus; inc.updatedAt = now;
  if (toStatus === "resolved") inc.resolvedAt = now;
  if (toStatus === "closed") inc.closedAt = now;
  storeIncident(inc);
  return inc;
}

export function canTransitionIncident(from: IncidentStatus, to: IncidentStatus): boolean {
  return VALID_INCIDENT_TRANSITIONS[from]?.includes(to) ?? false;
}

export function escalateIncident(incidentId: string, escalatedBy: string, reason: string): Incident | null {
  const inc = getIncident(incidentId);
  if (!inc) return null;
  const fromLevel = inc.escalationLevel;
  inc.escalationLevel += 1;
  inc.updatedAt = new Date().toISOString();
  const entry: IncidentTimelineEntry = { id: randomUUID(), timestamp: inc.updatedAt, actorId: escalatedBy, action: "escalated", description: `Escalated to level ${inc.escalationLevel}: ${reason}`, metadata: { fromLevel, toLevel: inc.escalationLevel } };
  inc.timeline.push(entry);
  const esc: IncidentEscalation = { id: randomUUID(), incidentId, fromLevel, toLevel: inc.escalationLevel, escalatedBy, reason, timestamp: inc.updatedAt };
  storeEscalation(esc);
  storeIncident(inc);
  log.warn("incident.escalated", { incidentId, level: inc.escalationLevel });
  return inc;
}

export function setRootCause(incidentId: string, rootCause: string, actorId: string): Incident | null {
  const inc = getIncident(incidentId);
  if (!inc) return null;
  inc.rootCause = rootCause; inc.updatedAt = new Date().toISOString();
  inc.timeline.push({ id: randomUUID(), timestamp: inc.updatedAt, actorId, action: "root_cause_set", description: rootCause, metadata: {} });
  storeIncident(inc);
  return inc;
}

export function setResolution(incidentId: string, resolution: string, actorId: string): Incident | null {
  const inc = getIncident(incidentId);
  if (!inc) return null;
  inc.resolution = resolution; inc.updatedAt = new Date().toISOString();
  inc.timeline.push({ id: randomUUID(), timestamp: inc.updatedAt, actorId, action: "resolution_set", description: resolution, metadata: {} });
  storeIncident(inc);
  return inc;
}

export function setPostmortem(incidentId: string, postmortem: string, actorId: string): Incident | null {
  const inc = getIncident(incidentId);
  if (!inc) return null;
  inc.postmortem = postmortem; inc.updatedAt = new Date().toISOString();
  inc.timeline.push({ id: randomUUID(), timestamp: inc.updatedAt, actorId, action: "postmortem_set", description: postmortem, metadata: {} });
  storeIncident(inc);
  return inc;
}

export function assignIncident(incidentId: string, owner: string, actorId: string): Incident | null {
  const inc = getIncident(incidentId);
  if (!inc) return null;
  inc.owner = owner; inc.updatedAt = new Date().toISOString();
  inc.timeline.push({ id: randomUUID(), timestamp: inc.updatedAt, actorId, action: "assigned", description: `Assigned to ${owner}`, metadata: {} });
  storeIncident(inc);
  return inc;
}

export function addTimelineEntry(incidentId: string, actorId: string, action: string, description: string): Incident | null {
  const inc = getIncident(incidentId);
  if (!inc) return null;
  inc.timeline.push({ id: randomUUID(), timestamp: new Date().toISOString(), actorId, action, description, metadata: {} });
  inc.updatedAt = new Date().toISOString();
  storeIncident(inc);
  return inc;
}

export function getIncidentEscalations(incidentId: string): IncidentEscalation[] { return getEscalations(incidentId); }

// ===== System 9 — Operational Alerts =====
export function createAlert(input: {
  severity: AlertSeverity; title: string; description: string; source: string;
  incidentId?: string | null;
}): OperationalAlert {
  const alert: OperationalAlert = {
    id: randomUUID(), severity: input.severity, status: "active",
    title: input.title, description: input.description, source: input.source,
    createdAt: new Date().toISOString(), acknowledgedAt: null, acknowledgedBy: null,
    assignedTo: null, resolvedAt: null, resolvedBy: null,
    escalationLevel: 0, incidentId: input.incidentId ?? null, history: [],
  };
  storeAlert(alert);
  log.info("alert.created", { id: alert.id, severity: input.severity });
  return alert;
}

export function getAlertById(id: string): OperationalAlert | null { return getAlert(id); }
export function listAlerts(status?: AlertStatus, severity?: AlertSeverity): OperationalAlert[] {
  let all = getAllAlerts();
  if (status) all = all.filter(a => a.status === status);
  if (severity) all = all.filter(a => a.severity === severity);
  return all;
}

export function acknowledgeAlert(alertId: string, acknowledgedBy: string): OperationalAlert | null {
  const a = getAlert(alertId);
  if (!a || a.status !== "active") return null;
  a.status = "acknowledged"; a.acknowledgedAt = new Date().toISOString(); a.acknowledgedBy = acknowledgedBy;
  a.history.push({ id: randomUUID(), timestamp: a.acknowledgedAt, action: "acknowledged", actorId: acknowledgedBy, note: "" });
  storeAlert(a);
  return a;
}

export function assignAlert(alertId: string, assignedTo: string, actorId: string): OperationalAlert | null {
  const a = getAlert(alertId);
  if (!a) return null;
  a.status = "assigned"; a.assignedTo = assignedTo;
  a.history.push({ id: randomUUID(), timestamp: new Date().toISOString(), action: "assigned", actorId, note: `Assigned to ${assignedTo}` });
  storeAlert(a);
  return a;
}

export function resolveAlert(alertId: string, resolvedBy: string, note: string): OperationalAlert | null {
  const a = getAlert(alertId);
  if (!a || a.status === "resolved") return null;
  a.status = "resolved"; a.resolvedAt = new Date().toISOString(); a.resolvedBy = resolvedBy;
  a.history.push({ id: randomUUID(), timestamp: a.resolvedAt, action: "resolved", actorId: resolvedBy, note });
  storeAlert(a);
  return a;
}

export function escalateAlert(alertId: string, actorId: string, reason: string): OperationalAlert | null {
  const a = getAlert(alertId);
  if (!a) return null;
  a.escalationLevel += 1;
  a.history.push({ id: randomUUID(), timestamp: new Date().toISOString(), action: "escalated", actorId, note: `Level ${a.escalationLevel}: ${reason}` });
  storeAlert(a);
  return a;
}

export function supportsAllSeverities(): AlertSeverity[] { return ["critical", "high", "medium", "low", "informational"]; }
export function supportsAllIncidentSeverities(): IncidentSeverity[] { return ["critical", "high", "medium", "low"]; }
export function supportsAllIncidentStatuses(): IncidentStatus[] { return ["open", "investigating", "identified", "monitoring", "resolved", "closed"]; }
export function supportsAllIncidentPriorities(): IncidentPriority[] { return ["p1", "p2", "p3", "p4"]; }
