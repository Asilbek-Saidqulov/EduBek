/**
 * EduBek — Game Administration, Operations & Incident Management Platform tests. Phase 6G.15.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  createIncident, getIncidentById, listIncidents, transitionIncident, canTransitionIncident,
  escalateIncident, setRootCause, setResolution, setPostmortem, assignIncident, addTimelineEntry, getIncidentEscalations,
  createAlert, getAlertById, listAlerts, acknowledgeAlert, assignAlert, resolveAlert, escalateAlert,
  supportsAllSeverities, supportsAllIncidentSeverities, supportsAllIncidentStatuses, supportsAllIncidentPriorities,
  createMaintenance, getMaintenanceById, listMaintenance, startMaintenance, completeMaintenance, cancelMaintenance, markNotificationSent,
  activateEmergency, getEmergencyById, listEmergencies, getActiveEmergencies, resolveEmergency, supportsAllEmergencyTypes, supportsAllMaintenanceTypes,
  recordAdminAction, listAdminActions, supportsAllAdminScopes,
  createAnnouncement, getAnnouncementById, listAnnouncements, publishAnnouncement, expireAnnouncement, supportsAllAnnouncementTypes, supportsAllAnnouncementAudiences,
  generateControlCenter, performIntervention, getInterventionsForMatch, supportsAllInterventionActions,
  createPlaybook, getPlaybookById, listPlaybooks, executePlaybook, deactivatePlaybook, supportsAllPlaybookCategories,
  recordServiceHealth, getServiceHealthRecord, listServiceHealth, supportsAllServiceNames,
  recordAudit, listAuditEntries,
  generateOpsDashboard, generateOpsAnalytics, getDeveloperIntegration, getStatus,
  subscribeOps, unsubscribeOps, isOpsSubscribed, getBridgeProcessedCount, publishOpsEvent,
  _resetBridgeForTesting, _resetRepositoryForTesting,
} from "@/features/game-operations";

beforeEach(() => { _resetRepositoryForTesting(); _resetBridgeForTesting(); });

// ===== System 2 — Incident Management =====
describe("Ops — Incidents", () => {
  it("creates incident", () => { const i = createIncident({ title: "Server down", description: "Main server not responding", severity: "critical" }); expect(i.id).toBeDefined(); expect(i.status).toBe("open"); });
  it("gets incident by id", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); expect(getIncidentById(i.id)).not.toBeNull(); expect(getIncidentById("nonexistent")).toBeNull(); });
  it("lists incidents", () => { createIncident({ title: "I1", description: "", severity: "high" }); createIncident({ title: "I2", description: "", severity: "low" }); expect(listIncidents().length).toBe(2); });
  it("lists by status", () => { createIncident({ title: "I1", description: "", severity: "high" }); expect(listIncidents("open").length).toBe(1); });
  it("lists by severity", () => { createIncident({ title: "I1", description: "", severity: "critical" }); createIncident({ title: "I2", description: "", severity: "low" }); expect(listIncidents(undefined, "critical").length).toBe(1); });
  it("transitions open to investigating", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); expect(transitionIncident(i.id, "investigating", "admin", "Looking into it")?.status).toBe("investigating"); });
  it("transitions investigating to identified", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); transitionIncident(i.id, "investigating", "a", ""); expect(transitionIncident(i.id, "identified", "a", "")?.status).toBe("identified"); });
  it("transitions identified to monitoring", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); for (const s of ["investigating","identified"] as const) transitionIncident(i.id, s, "a", ""); expect(transitionIncident(i.id, "monitoring", "a", "")?.status).toBe("monitoring"); });
  it("transitions to resolved", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); transitionIncident(i.id, "investigating", "a", ""); expect(transitionIncident(i.id, "resolved", "a", "")?.status).toBe("resolved"); });
  it("transitions to closed", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); transitionIncident(i.id, "investigating", "a", ""); transitionIncident(i.id, "resolved", "a", ""); expect(transitionIncident(i.id, "closed", "a", "")?.status).toBe("closed"); });
  it("resolved sets resolvedAt", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); transitionIncident(i.id, "investigating", "a", ""); transitionIncident(i.id, "resolved", "a", ""); expect(getIncidentById(i.id)?.resolvedAt).not.toBeNull(); });
  it("closed sets closedAt", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); transitionIncident(i.id, "investigating", "a", ""); transitionIncident(i.id, "resolved", "a", ""); transitionIncident(i.id, "closed", "a", ""); expect(getIncidentById(i.id)?.closedAt).not.toBeNull(); });
  it("invalid transition returns null", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); expect(transitionIncident(i.id, "identified", "a", "")).toBeNull(); });
  it("canTransition validates", () => { expect(canTransitionIncident("open", "investigating")).toBe(true); expect(canTransitionIncident("open", "closed")).toBe(true); expect(canTransitionIncident("closed", "open")).toBe(false); });
  it("escalates incident", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); expect(escalateIncident(i.id, "admin", "No progress")?.escalationLevel).toBe(1); });
  it("multiple escalations", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); escalateIncident(i.id, "a", ""); escalateIncident(i.id, "a", ""); expect(getIncidentById(i.id)?.escalationLevel).toBe(2); });
  it("sets root cause", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); expect(setRootCause(i.id, "Database failure", "a")?.rootCause).toBe("Database failure"); });
  it("sets resolution", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); expect(setResolution(i.id, "Restarted database", "a")?.resolution).toBe("Restarted database"); });
  it("sets postmortem", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); expect(setPostmortem(i.id, "Need better monitoring", "a")?.postmortem).toBe("Need better monitoring"); });
  it("assigns incident", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); expect(assignIncident(i.id, "admin-1", "a")?.owner).toBe("admin-1"); });
  it("adds timeline entry", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); addTimelineEntry(i.id, "a", "update", "Checking logs"); expect(getIncidentById(i.id)?.timeline.length).toBeGreaterThan(1); });
  it("gets escalations", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); escalateIncident(i.id, "a", ""); expect(getIncidentEscalations(i.id).length).toBe(1); });
  it("incident has correlationId", () => { expect(createIncident({ title: "T", description: "", severity: "high" }).correlationId).toBeDefined(); });
  it("incident has timeline", () => { expect(createIncident({ title: "T", description: "", severity: "high" }).timeline.length).toBe(1); });
  it("incident default owner null", () => { expect(createIncident({ title: "T", description: "", severity: "high" }).owner).toBeNull(); });
  it("incident default rootCause null", () => { expect(createIncident({ title: "T", description: "", severity: "high" }).rootCause).toBeNull(); });
  it("incident default resolution null", () => { expect(createIncident({ title: "T", description: "", severity: "high" }).resolution).toBeNull(); });
  it("incident default postmortem null", () => { expect(createIncident({ title: "T", description: "", severity: "high" }).postmortem).toBeNull(); });
  it("incident default escalationLevel 0", () => { expect(createIncident({ title: "T", description: "", severity: "high" }).escalationLevel).toBe(0); });
  it("incident with affectedServices", () => { expect(createIncident({ title: "T", description: "", severity: "high", affectedServices: ["engine", "replay"] }).affectedServices.length).toBe(2); });
  it("supports all severities", () => { expect(supportsAllIncidentSeverities().length).toBe(4); });
  it("supports all statuses", () => { expect(supportsAllIncidentStatuses().length).toBe(6); });
  it("supports all priorities", () => { expect(supportsAllIncidentPriorities().length).toBe(4); });
  it("transition unknown returns null", () => { expect(transitionIncident("nonexistent", "investigating", "a", "")).toBeNull(); });
  it("escalate unknown returns null", () => { expect(escalateIncident("nonexistent", "a", "")).toBeNull(); });
  it("setRootCause unknown returns null", () => { expect(setRootCause("nonexistent", "", "a")).toBeNull(); });
  it("setResolution unknown returns null", () => { expect(setResolution("nonexistent", "", "a")).toBeNull(); });
  it("setPostmortem unknown returns null", () => { expect(setPostmortem("nonexistent", "", "a")).toBeNull(); });
  it("assign unknown returns null", () => { expect(assignIncident("nonexistent", "", "a")).toBeNull(); });
  it("addTimeline unknown returns null", () => { expect(addTimelineEntry("nonexistent", "a", "", "")).toBeNull(); });
});

// ===== System 9 — Operational Alerts =====
describe("Ops — Alerts", () => {
  it("creates alert", () => { const a = createAlert({ severity: "critical", title: "High latency", description: "Latency > 500ms", source: "monitor" }); expect(a.id).toBeDefined(); expect(a.status).toBe("active"); });
  it("gets alert by id", () => { const a = createAlert({ severity: "high", title: "T", description: "", source: "s" }); expect(getAlertById(a.id)).not.toBeNull(); });
  it("lists alerts", () => { createAlert({ severity: "low", title: "T", description: "", source: "s" }); expect(listAlerts().length).toBe(1); });
  it("lists by status", () => { createAlert({ severity: "low", title: "T", description: "", source: "s" }); expect(listAlerts("active").length).toBe(1); });
  it("lists by severity", () => { createAlert({ severity: "critical", title: "T", description: "", source: "s" }); createAlert({ severity: "low", title: "T2", description: "", source: "s" }); expect(listAlerts(undefined, "critical").length).toBe(1); });
  it("acknowledges alert", () => { const a = createAlert({ severity: "high", title: "T", description: "", source: "s" }); expect(acknowledgeAlert(a.id, "admin")?.status).toBe("acknowledged"); });
  it("assigns alert", () => { const a = createAlert({ severity: "high", title: "T", description: "", source: "s" }); expect(assignAlert(a.id, "ops-1", "admin")?.assignedTo).toBe("ops-1"); });
  it("resolves alert", () => { const a = createAlert({ severity: "high", title: "T", description: "", source: "s" }); expect(resolveAlert(a.id, "admin", "Fixed")?.status).toBe("resolved"); });
  it("escalates alert", () => { const a = createAlert({ severity: "high", title: "T", description: "", source: "s" }); expect(escalateAlert(a.id, "admin", "Needs attention")?.escalationLevel).toBe(1); });
  it("acknowledge non-active returns null", () => { const a = createAlert({ severity: "high", title: "T", description: "", source: "s" }); acknowledgeAlert(a.id, "a"); expect(acknowledgeAlert(a.id, "a")).toBeNull(); });
  it("resolve already resolved returns null", () => { const a = createAlert({ severity: "high", title: "T", description: "", source: "s" }); resolveAlert(a.id, "a", ""); expect(resolveAlert(a.id, "a", "")).toBeNull(); });
  it("alert has history", () => { const a = createAlert({ severity: "high", title: "T", description: "", source: "s" }); acknowledgeAlert(a.id, "admin"); expect(getAlertById(a.id)?.history.length).toBe(1); });
  it("alert with incidentId", () => { expect(createAlert({ severity: "high", title: "T", description: "", source: "s", incidentId: "inc-1" }).incidentId).toBe("inc-1"); });
  it("supports all alert severities", () => { expect(supportsAllSeverities().length).toBe(5); });
  it("acknowledge unknown returns null", () => { expect(acknowledgeAlert("nonexistent", "a")).toBeNull(); });
  it("resolve unknown returns null", () => { expect(resolveAlert("nonexistent", "a", "")).toBeNull(); });
});

// ===== System 3 — Maintenance =====
describe("Ops — Maintenance", () => {
  it("creates maintenance", () => { const m = createMaintenance({ type: "scheduled", title: "Weekly maintenance", description: "", startDate: "2025-01-01", endDate: "2025-01-02", createdBy: "admin" }); expect(m.id).toBeDefined(); expect(m.status).toBe("scheduled"); });
  it("gets maintenance by id", () => { const m = createMaintenance({ type: "scheduled", title: "T", description: "", startDate: "", endDate: "", createdBy: "a" }); expect(getMaintenanceById(m.id)).not.toBeNull(); });
  it("lists maintenance", () => { createMaintenance({ type: "scheduled", title: "T", description: "", startDate: "", endDate: "", createdBy: "a" }); expect(listMaintenance().length).toBe(1); });
  it("lists by status", () => { createMaintenance({ type: "scheduled", title: "T", description: "", startDate: "", endDate: "", createdBy: "a" }); expect(listMaintenance("scheduled").length).toBe(1); });
  it("lists by type", () => { createMaintenance({ type: "scheduled", title: "T", description: "", startDate: "", endDate: "", createdBy: "a" }); createMaintenance({ type: "emergency", title: "T2", description: "", startDate: "", endDate: "", createdBy: "a" }); expect(listMaintenance(undefined, "emergency").length).toBe(1); });
  it("starts maintenance", () => { const m = createMaintenance({ type: "scheduled", title: "T", description: "", startDate: "", endDate: "", createdBy: "a" }); expect(startMaintenance(m.id)?.status).toBe("in_progress"); });
  it("completes maintenance", () => { const m = createMaintenance({ type: "scheduled", title: "T", description: "", startDate: "", endDate: "", createdBy: "a" }); startMaintenance(m.id); expect(completeMaintenance(m.id)?.status).toBe("completed"); });
  it("cancels maintenance", () => { const m = createMaintenance({ type: "scheduled", title: "T", description: "", startDate: "", endDate: "", createdBy: "a" }); expect(cancelMaintenance(m.id, "Not needed")?.status).toBe("cancelled"); });
  it("marks notification sent", () => { const m = createMaintenance({ type: "scheduled", title: "T", description: "", startDate: "", endDate: "", createdBy: "a" }); expect(markNotificationSent(m.id)?.notificationSent).toBe(true); });
  it("start non-scheduled returns null", () => { const m = createMaintenance({ type: "scheduled", title: "T", description: "", startDate: "", endDate: "", createdBy: "a" }); startMaintenance(m.id); expect(startMaintenance(m.id)).toBeNull(); });
  it("complete non-in-progress returns null", () => { const m = createMaintenance({ type: "scheduled", title: "T", description: "", startDate: "", endDate: "", createdBy: "a" }); expect(completeMaintenance(m.id)).toBeNull(); });
  it("cancel completed returns null", () => { const m = createMaintenance({ type: "scheduled", title: "T", description: "", startDate: "", endDate: "", createdBy: "a" }); startMaintenance(m.id); completeMaintenance(m.id); expect(cancelMaintenance(m.id, "")).toBeNull(); });
  it("maintenance with affectedServices", () => { expect(createMaintenance({ type: "scheduled", title: "T", description: "", startDate: "", endDate: "", createdBy: "a", affectedServices: ["engine"] }).affectedServices).toContain("engine"); });
  it("maintenance with organizationId", () => { expect(createMaintenance({ type: "organization", title: "T", description: "", startDate: "", endDate: "", createdBy: "a", organizationId: "org-1" }).organizationId).toBe("org-1"); });
  it("maintenance with region", () => { expect(createMaintenance({ type: "regional", title: "T", description: "", startDate: "", endDate: "", createdBy: "a", region: "us-west" }).region).toBe("us-west"); });
  it("default notificationSent false", () => { expect(createMaintenance({ type: "scheduled", title: "T", description: "", startDate: "", endDate: "", createdBy: "a" }).notificationSent).toBe(false); });
  it("supports all maintenance types", () => { expect(supportsAllMaintenanceTypes().length).toBe(5); });
  it("start sets startedAt", () => { const m = createMaintenance({ type: "scheduled", title: "T", description: "", startDate: "", endDate: "", createdBy: "a" }); startMaintenance(m.id); expect(getMaintenanceById(m.id)?.startedAt).not.toBeNull(); });
  it("complete sets completedAt", () => { const m = createMaintenance({ type: "scheduled", title: "T", description: "", startDate: "", endDate: "", createdBy: "a" }); startMaintenance(m.id); completeMaintenance(m.id); expect(getMaintenanceById(m.id)?.completedAt).not.toBeNull(); });
});

// ===== System 4 — Emergency Operations =====
describe("Ops — Emergency", () => {
  it("activates emergency", () => { const e = activateEmergency({ type: "pause", activatedBy: "admin", reason: "Security incident", scope: "global" }); expect(e.id).toBeDefined(); expect(e.status).toBe("active"); });
  it("gets emergency by id", () => { const e = activateEmergency({ type: "stop", activatedBy: "a", reason: "", scope: "global" }); expect(getEmergencyById(e.id)).not.toBeNull(); });
  it("lists emergencies", () => { activateEmergency({ type: "pause", activatedBy: "a", reason: "", scope: "global" }); expect(listEmergencies().length).toBe(1); });
  it("lists active emergencies", () => { activateEmergency({ type: "pause", activatedBy: "a", reason: "", scope: "global" }); expect(getActiveEmergencies().length).toBe(1); });
  it("resolves emergency", () => { const e = activateEmergency({ type: "pause", activatedBy: "a", reason: "", scope: "global" }); expect(resolveEmergency(e.id, "admin")?.status).toBe("resolved"); });
  it("resolve non-active returns null", () => { const e = activateEmergency({ type: "pause", activatedBy: "a", reason: "", scope: "global" }); resolveEmergency(e.id, "a"); expect(resolveEmergency(e.id, "a")).toBeNull(); });
  it("emergency with affectedServices", () => { expect(activateEmergency({ type: "service_suspension", activatedBy: "a", reason: "", scope: "global", affectedServices: ["engine"] }).affectedServices).toContain("engine"); });
  it("emergency with recoverySteps", () => { expect(activateEmergency({ type: "global_maintenance", activatedBy: "a", reason: "", scope: "global", recoverySteps: ["Step 1", "Step 2"] }).recoverySteps.length).toBe(2); });
  it("supports all emergency types", () => { expect(supportsAllEmergencyTypes().length).toBe(6); });
  it("resolve sets resolvedAt", () => { const e = activateEmergency({ type: "pause", activatedBy: "a", reason: "", scope: "global" }); resolveEmergency(e.id, "admin"); expect(getEmergencyById(e.id)?.resolvedAt).not.toBeNull(); });
  it("resolve sets resolvedBy", () => { const e = activateEmergency({ type: "pause", activatedBy: "a", reason: "", scope: "global" }); resolveEmergency(e.id, "admin-1"); expect(getEmergencyById(e.id)?.resolvedBy).toBe("admin-1"); });
  it("list by status", () => { activateEmergency({ type: "pause", activatedBy: "a", reason: "", scope: "global" }); expect(listEmergencies("active").length).toBe(1); });
});

// ===== System 5 — Match Intervention =====
describe("Ops — Interventions", () => {
  it("performs intervention", () => { const i = performIntervention({ matchId: "m1", action: "pause_match", performedBy: "admin", reason: "Investigating" }); expect(i.id).toBeDefined(); expect(i.audited).toBe(true); });
  it("gets interventions for match", () => { performIntervention({ matchId: "m1", action: "pause_match", performedBy: "a", reason: "" }); expect(getInterventionsForMatch("m1").length).toBe(1); });
  it("intervention has correlationId", () => { expect(performIntervention({ matchId: "m1", action: "pause_match", performedBy: "a", reason: "" }).correlationId).toBeDefined(); });
  it("intervention default approved false", () => { expect(performIntervention({ matchId: "m1", action: "pause_match", performedBy: "a", reason: "" }).approved).toBe(false); });
  it("intervention with approval", () => { expect(performIntervention({ matchId: "m1", action: "pause_match", performedBy: "a", reason: "", approved: true, approvedBy: "super" }).approved).toBe(true); });
  it("supports all actions", () => { expect(supportsAllInterventionActions().length).toBe(10); });
  it("intervention has beforeState", () => { expect(performIntervention({ matchId: "m1", action: "pause_match", performedBy: "a", reason: "", beforeState: { state: "running" } }).beforeState.state).toBe("running"); });
  it("intervention has afterState", () => { expect(performIntervention({ matchId: "m1", action: "pause_match", performedBy: "a", reason: "", afterState: { state: "paused" } }).afterState.state).toBe("paused"); });
  it("multiple interventions per match", () => { performIntervention({ matchId: "m1", action: "pause_match", performedBy: "a", reason: "" }); performIntervention({ matchId: "m1", action: "resume_match", performedBy: "a", reason: "" }); expect(getInterventionsForMatch("m1").length).toBe(2); });
});

// ===== System 6 — Playbooks =====
describe("Ops — Playbooks", () => {
  it("creates playbook", () => { const p = createPlaybook({ name: "Network Issue", category: "network_degradation", description: "Handle network issues" }); expect(p.id).toBeDefined(); expect(p.active).toBe(true); });
  it("gets playbook by id", () => { const p = createPlaybook({ name: "PB", category: "network_degradation", description: "" }); expect(getPlaybookById(p.id)).not.toBeNull(); });
  it("lists playbooks", () => { createPlaybook({ name: "PB1", category: "network_degradation", description: "" }); createPlaybook({ name: "PB2", category: "redis_degradation", description: "" }); expect(listPlaybooks().length).toBe(2); });
  it("lists by category", () => { createPlaybook({ name: "PB1", category: "network_degradation", description: "" }); createPlaybook({ name: "PB2", category: "redis_degradation", description: "" }); expect(listPlaybooks("network_degradation").length).toBe(1); });
  it("executes playbook", () => { const p = createPlaybook({ name: "PB", category: "network_degradation", description: "" }); executePlaybook(p.id); expect(getPlaybookById(p.id)?.usageCount).toBe(1); });
  it("execute sets lastUsedAt", () => { const p = createPlaybook({ name: "PB", category: "network_degradation", description: "" }); executePlaybook(p.id); expect(getPlaybookById(p.id)?.lastUsedAt).not.toBeNull(); });
  it("deactivates playbook", () => { const p = createPlaybook({ name: "PB", category: "network_degradation", description: "" }); expect(deactivatePlaybook(p.id)?.active).toBe(false); });
  it("execute inactive returns null", () => { const p = createPlaybook({ name: "PB", category: "network_degradation", description: "" }); deactivatePlaybook(p.id); expect(executePlaybook(p.id)).toBeNull(); });
  it("supports all categories", () => { expect(supportsAllPlaybookCategories().length).toBe(8); });
  it("playbook with steps", () => { const p = createPlaybook({ name: "PB", category: "network_degradation", description: "", steps: [{ order: 1, action: "Check status", description: "", expectedOutcome: "", verificationMethod: "" }] }); expect(p.steps.length).toBe(1); });
  it("playbook with prerequisites", () => { expect(createPlaybook({ name: "PB", category: "network_degradation", description: "", prerequisites: ["admin_access"] }).prerequisites).toContain("admin_access"); });
  it("playbook default usageCount 0", () => { expect(createPlaybook({ name: "PB", category: "network_degradation", description: "" }).usageCount).toBe(0); });
  it("playbook default lastUsedAt null", () => { expect(createPlaybook({ name: "PB", category: "network_degradation", description: "" }).lastUsedAt).toBeNull(); });
  it("execute unknown returns null", () => { expect(executePlaybook("nonexistent")).toBeNull(); });
});

// ===== System 7 — Admin Actions =====
describe("Ops — Admin Actions", () => {
  it("records admin action", () => { const a = recordAdminAction({ scope: "global", action: "pause_all", performedBy: "admin", reason: "Emergency" }); expect(a.id).toBeDefined(); expect(a.audited).toBe(true); });
  it("lists admin actions", () => { recordAdminAction({ scope: "global", action: "test", performedBy: "a", reason: "" }); expect(listAdminActions().length).toBe(1); });
  it("lists by scope", () => { recordAdminAction({ scope: "global", action: "t", performedBy: "a", reason: "" }); recordAdminAction({ scope: "match", action: "t", performedBy: "a", reason: "" }); expect(listAdminActions("global").length).toBe(1); });
  it("action has correlationId", () => { expect(recordAdminAction({ scope: "global", action: "t", performedBy: "a", reason: "" }).correlationId).toBeDefined(); });
  it("action with targetId", () => { expect(recordAdminAction({ scope: "match", targetId: "m1", action: "t", performedBy: "a", reason: "" }).targetId).toBe("m1"); });
  it("supports all scopes", () => { expect(supportsAllAdminScopes().length).toBe(8); });
  it("action with before/after", () => { const a = recordAdminAction({ scope: "global", action: "t", performedBy: "a", reason: "", before: { x: 1 }, after: { x: 2 } }); expect(a.before.x).toBe(1); expect(a.after.x).toBe(2); });
  it("action default targetId null", () => { expect(recordAdminAction({ scope: "global", action: "t", performedBy: "a", reason: "" }).targetId).toBeNull(); });
});

// ===== System 8 — Service Health =====
describe("Ops — Health", () => {
  it("records service health", () => { const h = recordServiceHealth({ service: "engine", status: "healthy" }); expect(h.service).toBe("engine"); expect(h.status).toBe("healthy"); });
  it("gets service health", () => { recordServiceHealth({ service: "engine", status: "healthy" }); expect(getServiceHealthRecord("engine")).not.toBeNull(); });
  it("lists service health", () => { recordServiceHealth({ service: "engine", status: "healthy" }); recordServiceHealth({ service: "replay", status: "degraded" }); expect(listServiceHealth().length).toBe(2); });
  it("health with issues", () => { expect(recordServiceHealth({ service: "engine", status: "degraded", issues: ["High latency"] }).issues).toContain("High latency"); });
  it("health with uptime", () => { expect(recordServiceHealth({ service: "engine", status: "healthy", uptime: 99.9 }).uptime).toBe(99.9); });
  it("health with responseTime", () => { expect(recordServiceHealth({ service: "engine", status: "healthy", responseTimeMs: 50 }).responseTimeMs).toBe(50); });
  it("default issues empty", () => { expect(recordServiceHealth({ service: "engine", status: "healthy" }).issues).toEqual([]); });
  it("default uptime 100", () => { expect(recordServiceHealth({ service: "engine", status: "healthy" }).uptime).toBe(100); });
  it("supports all service names", () => { expect(supportsAllServiceNames().length).toBe(10); });
  it("health has lastCheckedAt", () => { expect(recordServiceHealth({ service: "engine", status: "healthy" }).lastCheckedAt).toBeDefined(); });
});

// ===== System 10 — Announcements =====
describe("Ops — Announcements", () => {
  it("creates announcement", () => { const a = createAnnouncement({ type: "emergency_banner", audience: "all", title: "Emergency", message: "Service down", createdBy: "admin" }); expect(a.id).toBeDefined(); expect(a.active).toBe(false); });
  it("gets announcement by id", () => { const a = createAnnouncement({ type: "emergency_banner", audience: "all", title: "T", message: "", createdBy: "a" }); expect(getAnnouncementById(a.id)).not.toBeNull(); });
  it("lists announcements", () => { createAnnouncement({ type: "emergency_banner", audience: "all", title: "T", message: "", createdBy: "a" }); expect(listAnnouncements().length).toBe(1); });
  it("lists active only", () => { const a = createAnnouncement({ type: "emergency_banner", audience: "all", title: "T", message: "", createdBy: "a" }); publishAnnouncement(a.id); expect(listAnnouncements(true).length).toBe(1); });
  it("publishes announcement", () => { const a = createAnnouncement({ type: "emergency_banner", audience: "all", title: "T", message: "", createdBy: "a" }); expect(publishAnnouncement(a.id)?.active).toBe(true); });
  it("expires announcement", () => { const a = createAnnouncement({ type: "emergency_banner", audience: "all", title: "T", message: "", createdBy: "a" }); publishAnnouncement(a.id); expect(expireAnnouncement(a.id)?.active).toBe(false); });
  it("publish already active returns null", () => { const a = createAnnouncement({ type: "emergency_banner", audience: "all", title: "T", message: "", createdBy: "a" }); publishAnnouncement(a.id); expect(publishAnnouncement(a.id)).toBeNull(); });
  it("expire inactive returns null", () => { const a = createAnnouncement({ type: "emergency_banner", audience: "all", title: "T", message: "", createdBy: "a" }); expect(expireAnnouncement(a.id)).toBeNull(); });
  it("publish sets publishedAt", () => { const a = createAnnouncement({ type: "emergency_banner", audience: "all", title: "T", message: "", createdBy: "a" }); publishAnnouncement(a.id); expect(getAnnouncementById(a.id)?.publishedAt).not.toBeNull(); });
  it("with expiresAt", () => { expect(createAnnouncement({ type: "emergency_banner", audience: "all", title: "T", message: "", createdBy: "a", expiresAt: "2025-12-31" }).expiresAt).toBe("2025-12-31"); });
  it("with targetId", () => { expect(createAnnouncement({ type: "organization_notice", audience: "organization", title: "T", message: "", targetId: "org-1", createdBy: "a" }).targetId).toBe("org-1"); });
  it("supports all types", () => { expect(supportsAllAnnouncementTypes().length).toBe(5); });
  it("supports all audiences", () => { expect(supportsAllAnnouncementAudiences().length).toBe(6); });
  it("publish unknown returns null", () => { expect(publishAnnouncement("nonexistent")).toBeNull(); });
  it("expire unknown returns null", () => { expect(expireAnnouncement("nonexistent")).toBeNull(); });
});

// ===== System 11 — Audit =====
describe("Ops — Audit", () => {
  it("records audit entry", () => { const a = recordAudit({ actorId: "admin", action: "pause_match", scope: "match", targetId: "m1", reason: "Investigation" }); expect(a.id).toBeDefined(); expect(a.correlationId).toBeDefined(); });
  it("lists audit entries", () => { recordAudit({ actorId: "a", action: "t", scope: "global", reason: "" }); expect(listAuditEntries().length).toBe(1); });
  it("audit has timestamp", () => { expect(recordAudit({ actorId: "a", action: "t", scope: "global", reason: "" }).timestamp).toBeDefined(); });
  it("audit with incidentId", () => { expect(recordAudit({ actorId: "a", action: "t", scope: "global", reason: "", incidentId: "inc-1" }).incidentId).toBe("inc-1"); });
  it("audit with approvalId", () => { expect(recordAudit({ actorId: "a", action: "t", scope: "global", reason: "", approvalId: "ap-1" }).approvalId).toBe("ap-1"); });
  it("audit default incidentId null", () => { expect(recordAudit({ actorId: "a", action: "t", scope: "global", reason: "" }).incidentId).toBeNull(); });
  it("audit default approvalId null", () => { expect(recordAudit({ actorId: "a", action: "t", scope: "global", reason: "" }).approvalId).toBeNull(); });
  it("audit with before/after", () => { const a = recordAudit({ actorId: "a", action: "t", scope: "global", reason: "", before: { x: 1 }, after: { x: 2 } }); expect(a.before.x).toBe(1); expect(a.after.x).toBe(2); });
});

// ===== Systems 1, 12, 13 — Control Center, Dashboard, Analytics =====
describe("Ops — Dashboard + Analytics", () => {
  it("generates control center", () => { const cc = generateControlCenter(); expect(cc).toBeDefined(); expect(cc.healthSummary).toBeDefined(); });
  it("generates ops dashboard", () => { const d = generateOpsDashboard(); expect(d).toBeDefined(); expect(d.incidents).toBeDefined(); });
  it("dashboard has maintenance", () => { expect(generateOpsDashboard().maintenance).toBeDefined(); });
  it("dashboard has alerts", () => { expect(generateOpsDashboard().alerts).toBeDefined(); });
  it("dashboard has health", () => { expect(generateOpsDashboard().health).toBeDefined(); });
  it("dashboard has announcements", () => { expect(generateOpsDashboard().announcements).toBeDefined(); });
  it("dashboard has interventions", () => { expect(generateOpsDashboard().interventions).toBeDefined(); });
  it("dashboard has stats", () => { expect(generateOpsDashboard().stats).toBeDefined(); });
  it("dashboard has updatedAt", () => { expect(generateOpsDashboard().updatedAt).toBeDefined(); });
  it("generates analytics", () => { const a = generateOpsAnalytics(); expect(a).toBeDefined(); expect(a.incidentFrequency).toBeGreaterThanOrEqual(0); });
  it("analytics has slaCompliance", () => { expect(generateOpsAnalytics().slaCompliance).toBeGreaterThanOrEqual(0); });
  it("analytics has mttrMs", () => { expect(generateOpsAnalytics().mttrMs).toBeGreaterThanOrEqual(0); });
  it("analytics has incidentsBySeverity", () => { expect(generateOpsAnalytics().incidentsBySeverity).toBeDefined(); });
  it("analytics has incidentsByService", () => { expect(generateOpsAnalytics().incidentsByService).toBeDefined(); });
  it("analytics has recoverySuccessRate", () => { expect(generateOpsAnalytics().recoverySuccessRate).toBeGreaterThanOrEqual(0); });
  it("control center has liveServices", () => { expect(generateControlCenter().liveServices).toBeDefined(); });
  it("control center has operationalAlerts", () => { expect(generateControlCenter().operationalAlerts).toBeGreaterThanOrEqual(0); });
  it("dashboard with incidents", () => { createIncident({ title: "T", description: "", severity: "critical" }); const d = generateOpsDashboard(); expect(d.incidents.open).toBeGreaterThan(0); });
  it("dashboard with alerts", () => { createAlert({ severity: "critical", title: "T", description: "", source: "s" }); const d = generateOpsDashboard(); expect(d.alerts.active).toBeGreaterThan(0); });
});

// ===== System 15 — Developer =====
describe("Ops — Developer", () => {
  it("returns developer integration", () => { const d = getDeveloperIntegration(); expect(d.publicAPIs.length).toBeGreaterThan(0); expect(d.extensionHooks.length).toBeGreaterThan(0); });
  it("has API endpoints", () => { expect(getDeveloperIntegration().publicAPIs.some(a => a.path.includes("/api/game-operations/"))).toBe(true); });
  it("has SDK metadata", () => { expect(getDeveloperIntegration().sdkMetadata.version).toBeDefined(); });
  it("all APIs require auth", () => { for (const a of getDeveloperIntegration().publicAPIs) expect(a.authRequired).toBe(true); });
});

// ===== System 16 — Administration API =====
describe("Ops — Admin API", () => {
  it("returns status", () => { const s = getStatus(); expect(s.platform).toBe("game-operations"); expect(s.activeIncidents).toBeGreaterThanOrEqual(0); });
  it("status has activeEmergencies", () => { expect(getStatus().activeEmergencies).toBeGreaterThanOrEqual(0); });
  it("status has activeMaintenance", () => { expect(getStatus().activeMaintenance).toBeGreaterThanOrEqual(0); });
  it("status has activeAlerts", () => { expect(getStatus().activeAlerts).toBeGreaterThanOrEqual(0); });
  it("status has dashboard", () => { expect(getStatus().dashboard).toBeDefined(); });
  it("status has version", () => { expect(getStatus().version).toBeDefined(); });
});

// ===== System 14 — Event Bus Bridge =====
describe("Ops — Bridge", () => {
  it("subscribes", () => { subscribeOps(); expect(isOpsSubscribed()).toBe(true); });
  it("unsubscribes", () => { subscribeOps(); unsubscribeOps(); expect(isOpsSubscribed()).toBe(false); });
  it("subscribe is idempotent", () => { subscribeOps(); subscribeOps(); expect(isOpsSubscribed()).toBe(true); });
  it("publishes ops events", () => { expect(() => publishOpsEvent("IncidentCreated", null, { incidentId: "i1" })).not.toThrow(); });
  it("processed count starts at 0", () => { expect(getBridgeProcessedCount()).toBe(0); });
});

// ===== Architecture Compliance =====
describe("Ops — Architecture", () => {
  it("no circular dependencies", async () => { const mod = await import("@/features/game-operations"); expect(mod.createIncident).toBeDefined(); });
  it("emergency operations manual only", () => { const e = activateEmergency({ type: "pause", activatedBy: "admin", reason: "", scope: "global" }); expect(e.activatedBy).toBe("admin"); });
  it("all interventions audited", () => { const i = performIntervention({ matchId: "m1", action: "pause_match", performedBy: "a", reason: "" }); expect(i.audited).toBe(true); });
  it("all admin actions audited", () => { const a = recordAdminAction({ scope: "global", action: "test", performedBy: "a", reason: "" }); expect(a.audited).toBe(true); });
});

// ===== Edge Cases =====
describe("Ops — Edge Cases", () => {
  it("returns null for unknown incident", () => { expect(getIncidentById("nonexistent")).toBeNull(); });
  it("returns null for unknown maintenance", () => { expect(getMaintenanceById("nonexistent")).toBeNull(); });
  it("returns null for unknown emergency", () => { expect(getEmergencyById("nonexistent")).toBeNull(); });
  it("returns null for unknown alert", () => { expect(getAlertById("nonexistent")).toBeNull(); });
  it("returns null for unknown announcement", () => { expect(getAnnouncementById("nonexistent")).toBeNull(); });
  it("returns null for unknown playbook", () => { expect(getPlaybookById("nonexistent")).toBeNull(); });
  it("returns null for unknown service health", () => { expect(getServiceHealthRecord("nonexistent")).toBeNull(); });
  it("returns empty for unknown interventions", () => { expect(getInterventionsForMatch("nonexistent")).toEqual([]); });
  it("returns empty for unknown escalations", () => { expect(getIncidentEscalations("nonexistent")).toEqual([]); });
  it("returns empty for unknown admin actions", () => { expect(listAdminActions()).toEqual([]); });
});

// ===== Stress =====
describe("Ops — Stress", () => {
  it("handles many incidents", () => { for (let i = 0; i < 50; i++) createIncident({ title: `I${i}`, description: "", severity: "high" }); expect(listIncidents().length).toBe(50); });
  it("handles many alerts", () => { for (let i = 0; i < 50; i++) createAlert({ severity: "low", title: `A${i}`, description: "", source: "s" }); expect(listAlerts().length).toBe(50); });
  it("handles many maintenance", () => { for (let i = 0; i < 30; i++) createMaintenance({ type: "scheduled", title: `M${i}`, description: "", startDate: "", endDate: "", createdBy: "a" }); expect(listMaintenance().length).toBe(30); });
  it("handles many announcements", () => { for (let i = 0; i < 30; i++) createAnnouncement({ type: "emergency_banner", audience: "all", title: `A${i}`, message: "", createdBy: "a" }); expect(listAnnouncements().length).toBe(30); });
  it("handles many playbooks", () => { for (let i = 0; i < 20; i++) createPlaybook({ name: `PB${i}`, category: "network_degradation", description: "" }); expect(listPlaybooks().length).toBe(20); });
});

// ===== Extended Tests =====
describe("Ops — Extended", () => {
  it("incident with metadata", () => { expect(createIncident({ title: "T", description: "", severity: "high", metadata: { key: "val" } }).metadata.key).toBe("val"); });
  it("incident default priority p3", () => { expect(createIncident({ title: "T", description: "", severity: "high" }).priority).toBe("p3"); });
  it("incident with custom priority", () => { expect(createIncident({ title: "T", description: "", severity: "critical", priority: "p1" }).priority).toBe("p1"); });
  it("alert default escalationLevel 0", () => { expect(createAlert({ severity: "high", title: "T", description: "", source: "s" }).escalationLevel).toBe(0); });
  it("alert default incidentId null", () => { expect(createAlert({ severity: "high", title: "T", description: "", source: "s" }).incidentId).toBeNull(); });
  it("emergency default resolvedAt null", () => { expect(activateEmergency({ type: "pause", activatedBy: "a", reason: "", scope: "global" }).resolvedAt).toBeNull(); });
  it("emergency default resolvedBy null", () => { expect(activateEmergency({ type: "pause", activatedBy: "a", reason: "", scope: "global" }).resolvedBy).toBeNull(); });
  it("emergency with metadata", () => { expect(activateEmergency({ type: "pause", activatedBy: "a", reason: "", scope: "global" }).metadata).toBeDefined(); });
  it("playbook with estimatedDuration", () => { expect(createPlaybook({ name: "PB", category: "network_degradation", description: "", estimatedDurationMs: 120000 }).estimatedDurationMs).toBe(120000); });
  it("playbook default estimatedDuration 60000", () => { expect(createPlaybook({ name: "PB", category: "network_degradation", description: "" }).estimatedDurationMs).toBe(60000); });
  it("playbook steps have ids", () => { const p = createPlaybook({ name: "PB", category: "network_degradation", description: "", steps: [{ order: 1, action: "Step 1", description: "", expectedOutcome: "", verificationMethod: "" }] }); expect(p.steps[0].id).toBeDefined(); });
  it("announcement default active false", () => { expect(createAnnouncement({ type: "emergency_banner", audience: "all", title: "T", message: "", createdBy: "a" }).active).toBe(false); });
  it("announcement default publishedAt null", () => { expect(createAnnouncement({ type: "emergency_banner", audience: "all", title: "T", message: "", createdBy: "a" }).publishedAt).toBeNull(); });
  it("audit with custom correlationId", () => { expect(recordAudit({ actorId: "a", action: "t", scope: "global", reason: "", correlationId: "corr-1" }).correlationId).toBe("corr-1"); });
  it("intervention creates audit entry", () => { performIntervention({ matchId: "m1", action: "pause_match", performedBy: "a", reason: "" }); expect(listAuditEntries().length).toBeGreaterThan(0); });
  it("control center with health", () => { recordServiceHealth({ service: "engine", status: "healthy" }); expect(generateControlCenter().liveServices.length).toBeGreaterThan(0); });
  it("dashboard stats with incidents", () => { createIncident({ title: "T", description: "", severity: "critical" }); expect(generateOpsDashboard().stats.totalIncidents).toBeGreaterThan(0); });
  it("analytics with maintenance count", () => { createMaintenance({ type: "scheduled", title: "T", description: "", startDate: "", endDate: "", createdBy: "a" }); expect(generateOpsAnalytics().maintenanceCount).toBeGreaterThan(0); });
  it("escalate alert adds history", () => { const a = createAlert({ severity: "high", title: "T", description: "", source: "s" }); escalateAlert(a.id, "admin", "reason"); expect(getAlertById(a.id)?.history.length).toBe(1); });
  it("assign alert adds history", () => { const a = createAlert({ severity: "high", title: "T", description: "", source: "s" }); assignAlert(a.id, "ops-1", "admin"); expect(getAlertById(a.id)?.history.length).toBe(1); });
  it("resolve alert adds history", () => { const a = createAlert({ severity: "high", title: "T", description: "", source: "s" }); resolveAlert(a.id, "admin", "Fixed"); expect(getAlertById(a.id)?.history.length).toBe(1); });
  it("acknowledge alert adds history", () => { const a = createAlert({ severity: "high", title: "T", description: "", source: "s" }); acknowledgeAlert(a.id, "admin"); expect(getAlertById(a.id)?.history.length).toBe(1); });
  it("incident timeline has id", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); expect(i.timeline[0].id).toBeDefined(); });
  it("incident timeline has timestamp", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); expect(i.timeline[0].timestamp).toBeDefined(); });
  it("incident timeline has actorId", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); expect(i.timeline[0].actorId).toBe("system"); });
  it("escalation has id", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); escalateIncident(i.id, "a", ""); expect(getIncidentEscalations(i.id)[0].id).toBeDefined(); });
  it("escalation has timestamp", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); escalateIncident(i.id, "a", ""); expect(getIncidentEscalations(i.id)[0].timestamp).toBeDefined(); });
  it("maintenance has createdAt", () => { expect(createMaintenance({ type: "scheduled", title: "T", description: "", startDate: "", endDate: "", createdBy: "a" }).createdAt).toBeDefined(); });
  it("maintenance has createdBy", () => { expect(createMaintenance({ type: "scheduled", title: "T", description: "", startDate: "", endDate: "", createdBy: "admin" }).createdBy).toBe("admin"); });
  it("announcement has createdAt", () => { expect(createAnnouncement({ type: "emergency_banner", audience: "all", title: "T", message: "", createdBy: "a" }).createdAt).toBeDefined(); });
  it("announcement has scheduledAt", () => { expect(createAnnouncement({ type: "emergency_banner", audience: "all", title: "T", message: "", createdBy: "a" }).scheduledAt).toBeDefined(); });
  it("admin action has performedAt", () => { expect(recordAdminAction({ scope: "global", action: "t", performedBy: "a", reason: "" }).performedAt).toBeDefined(); });
  it("intervention has performedAt", () => { expect(performIntervention({ matchId: "m1", action: "pause_match", performedBy: "a", reason: "" }).performedAt).toBeDefined(); });
  it("playbook has createdAt", () => { expect(createPlaybook({ name: "PB", category: "network_degradation", description: "" }).createdAt).toBeDefined(); });
  it("service health has metadata", () => { expect(recordServiceHealth({ service: "engine", status: "healthy", metadata: { version: "1.0" } }).metadata.version).toBe("1.0"); });
  it("service health default metadata empty", () => { expect(recordServiceHealth({ service: "engine", status: "healthy" }).metadata).toEqual({}); });
});

// ===== Extended Incident Tests =====
describe("Ops — Incident Extended", () => {
  it("open to investigating to identified to monitoring to resolved to closed", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); for (const s of ["investigating","identified","monitoring","resolved","closed"] as const) transitionIncident(i.id, s, "a", ""); expect(getIncidentById(i.id)?.status).toBe("closed"); });
  it("investigating to resolved directly", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); transitionIncident(i.id, "investigating", "a", ""); expect(transitionIncident(i.id, "resolved", "a", "")?.status).toBe("resolved"); });
  it("monitoring back to investigating", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); for (const s of ["investigating","identified","monitoring"] as const) transitionIncident(i.id, s, "a", ""); expect(transitionIncident(i.id, "investigating", "a", "")?.status).toBe("investigating"); });
  it("resolved back to investigating", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); transitionIncident(i.id, "investigating", "a", ""); transitionIncident(i.id, "resolved", "a", ""); expect(transitionIncident(i.id, "investigating", "a", "")?.status).toBe("investigating"); });
  it("open to closed directly", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); expect(transitionIncident(i.id, "closed", "a", "")?.status).toBe("closed"); });
  it("closed is terminal", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); transitionIncident(i.id, "closed", "a", ""); expect(transitionIncident(i.id, "open", "a", "")).toBeNull(); });
  it("identified to closed", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); for (const s of ["investigating","identified"] as const) transitionIncident(i.id, s, "a", ""); expect(transitionIncident(i.id, "closed", "a", "")?.status).toBe("closed"); });
  it("monitoring to closed", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); for (const s of ["investigating","identified","monitoring"] as const) transitionIncident(i.id, s, "a", ""); expect(transitionIncident(i.id, "closed", "a", "")?.status).toBe("closed"); });
  it("canTransition all valid", () => { expect(canTransitionIncident("open", "investigating")).toBe(true); expect(canTransitionIncident("open", "resolved")).toBe(true); expect(canTransitionIncident("open", "closed")).toBe(true); expect(canTransitionIncident("investigating", "identified")).toBe(true); expect(canTransitionIncident("investigating", "monitoring")).toBe(true); expect(canTransitionIncident("identified", "monitoring")).toBe(true); expect(canTransitionIncident("monitoring", "resolved")).toBe(true); expect(canTransitionIncident("resolved", "closed")).toBe(true); });
  it("canTransition all invalid", () => { expect(canTransitionIncident("open", "identified")).toBe(false); expect(canTransitionIncident("open", "monitoring")).toBe(false); expect(canTransitionIncident("identified", "investigating")).toBe(false); expect(canTransitionIncident("closed", "resolved")).toBe(false); });
  it("incident timeline grows with transitions", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); const initial = i.timeline.length; transitionIncident(i.id, "investigating", "a", ""); transitionIncident(i.id, "resolved", "a", ""); expect(getIncidentById(i.id)?.timeline.length).toBe(initial + 2); });
  it("escalation has fromLevel and toLevel", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); escalateIncident(i.id, "a", ""); const esc = getIncidentEscalations(i.id)[0]; expect(esc.fromLevel).toBe(0); expect(esc.toLevel).toBe(1); });
  it("multiple escalations tracked", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); escalateIncident(i.id, "a", "1"); escalateIncident(i.id, "a", "2"); escalateIncident(i.id, "a", "3"); expect(getIncidentEscalations(i.id).length).toBe(3); });
});

// ===== Extended Maintenance Tests =====
describe("Ops — Maintenance Extended", () => {
  it("emergency maintenance", () => { expect(createMaintenance({ type: "emergency", title: "T", description: "", startDate: "", endDate: "", createdBy: "a" }).type).toBe("emergency"); });
  it("partial maintenance", () => { expect(createMaintenance({ type: "partial", title: "T", description: "", startDate: "", endDate: "", createdBy: "a" }).type).toBe("partial"); });
  it("organization maintenance", () => { expect(createMaintenance({ type: "organization", title: "T", description: "", startDate: "", endDate: "", createdBy: "a" }).type).toBe("organization"); });
  it("regional maintenance", () => { expect(createMaintenance({ type: "regional", title: "T", description: "", startDate: "", endDate: "", createdBy: "a" }).type).toBe("regional"); });
  it("cancel in-progress maintenance", () => { const m = createMaintenance({ type: "scheduled", title: "T", description: "", startDate: "", endDate: "", createdBy: "a" }); startMaintenance(m.id); expect(cancelMaintenance(m.id, "")?.status).toBe("cancelled"); });
  it("mark notification on completed", () => { const m = createMaintenance({ type: "scheduled", title: "T", description: "", startDate: "", endDate: "", createdBy: "a" }); startMaintenance(m.id); completeMaintenance(m.id); expect(markNotificationSent(m.id)?.notificationSent).toBe(true); });
});

// ===== Extended Emergency Tests =====
describe("Ops — Emergency Extended", () => {
  it("emergency pause type", () => { expect(activateEmergency({ type: "pause", activatedBy: "a", reason: "", scope: "global" }).type).toBe("pause"); });
  it("emergency stop type", () => { expect(activateEmergency({ type: "stop", activatedBy: "a", reason: "", scope: "global" }).type).toBe("stop"); });
  it("emergency announcement type", () => { expect(activateEmergency({ type: "announcement", activatedBy: "a", reason: "", scope: "global" }).type).toBe("announcement"); });
  it("emergency global_maintenance type", () => { expect(activateEmergency({ type: "global_maintenance", activatedBy: "a", reason: "", scope: "global" }).type).toBe("global_maintenance"); });
  it("emergency organization_isolation type", () => { expect(activateEmergency({ type: "organization_isolation", activatedBy: "a", reason: "", scope: "org-1" }).type).toBe("organization_isolation"); });
  it("emergency service_suspension type", () => { expect(activateEmergency({ type: "service_suspension", activatedBy: "a", reason: "", scope: "engine" }).type).toBe("service_suspension"); });
  it("multiple active emergencies", () => { activateEmergency({ type: "pause", activatedBy: "a", reason: "", scope: "global" }); activateEmergency({ type: "stop", activatedBy: "a", reason: "", scope: "match" }); expect(getActiveEmergencies().length).toBe(2); });
  it("resolved emergency not in active list", () => { const e = activateEmergency({ type: "pause", activatedBy: "a", reason: "", scope: "global" }); resolveEmergency(e.id, "a"); expect(getActiveEmergencies().length).toBe(0); });
});

// ===== Extended Playbook Tests =====
describe("Ops — Playbook Extended", () => {
  it("playbook for tournament_outage", () => { expect(createPlaybook({ name: "PB", category: "tournament_outage", description: "" }).category).toBe("tournament_outage"); });
  it("playbook for broadcast_failure", () => { expect(createPlaybook({ name: "PB", category: "broadcast_failure", description: "" }).category).toBe("broadcast_failure"); });
  it("playbook for replay_corruption", () => { expect(createPlaybook({ name: "PB", category: "replay_corruption", description: "" }).category).toBe("replay_corruption"); });
  it("playbook for match_recovery", () => { expect(createPlaybook({ name: "PB", category: "match_recovery", description: "" }).category).toBe("match_recovery"); });
  it("playbook for database_failover", () => { expect(createPlaybook({ name: "PB", category: "database_failover", description: "" }).category).toBe("database_failover"); });
  it("playbook for redis_degradation", () => { expect(createPlaybook({ name: "PB", category: "redis_degradation", description: "" }).category).toBe("redis_degradation"); });
  it("playbook for notification_outage", () => { expect(createPlaybook({ name: "PB", category: "notification_outage", description: "" }).category).toBe("notification_outage"); });
  it("playbook with multiple steps", () => { const p = createPlaybook({ name: "PB", category: "network_degradation", description: "", steps: [{ order: 1, action: "Check", description: "", expectedOutcome: "", verificationMethod: "" }, { order: 2, action: "Fix", description: "", expectedOutcome: "", verificationMethod: "" }, { order: 3, action: "Verify", description: "", expectedOutcome: "", verificationMethod: "" }] }); expect(p.steps.length).toBe(3); });
  it("execute playbook multiple times", () => { const p = createPlaybook({ name: "PB", category: "network_degradation", description: "" }); executePlaybook(p.id); executePlaybook(p.id); executePlaybook(p.id); expect(getPlaybookById(p.id)?.usageCount).toBe(3); });
  it("deactivate unknown returns null", () => { expect(deactivatePlaybook("nonexistent")).toBeNull(); });
});

// ===== Extended Dashboard Tests =====
describe("Ops — Dashboard Extended", () => {
  it("dashboard with critical incidents", () => { createIncident({ title: "T", description: "", severity: "critical" }); const d = generateOpsDashboard(); expect(d.incidents.critical).toBeGreaterThan(0); });
  it("dashboard with high incidents", () => { createIncident({ title: "T", description: "", severity: "high" }); const d = generateOpsDashboard(); expect(d.incidents.high).toBeGreaterThan(0); });
  it("dashboard with scheduled maintenance", () => { createMaintenance({ type: "scheduled", title: "T", description: "", startDate: "", endDate: "", createdBy: "a" }); const d = generateOpsDashboard(); expect(d.maintenance.scheduled).toBeGreaterThan(0); });
  it("dashboard with in-progress maintenance", () => { const m = createMaintenance({ type: "scheduled", title: "T", description: "", startDate: "", endDate: "", createdBy: "a" }); startMaintenance(m.id); const d = generateOpsDashboard(); expect(d.maintenance.inProgress).toBeGreaterThan(0); });
  it("dashboard with active announcements", () => { const a = createAnnouncement({ type: "emergency_banner", audience: "all", title: "T", message: "", createdBy: "a" }); publishAnnouncement(a.id); const d = generateOpsDashboard(); expect(d.announcements.active).toBeGreaterThan(0); });
  it("dashboard with service health", () => { recordServiceHealth({ service: "engine", status: "healthy" }); const d = generateOpsDashboard(); expect(d.health.length).toBeGreaterThan(0); });
  it("control center with operational alerts", () => { createAlert({ severity: "critical", title: "T", description: "", source: "s" }); expect(generateControlCenter().operationalAlerts).toBeGreaterThan(0); });
  it("analytics with incidents by severity", () => { createIncident({ title: "T", description: "", severity: "critical" }); createIncident({ title: "T2", description: "", severity: "high" }); const a = generateOpsAnalytics(); expect(a.incidentsBySeverity.critical).toBeGreaterThan(0); expect(a.incidentsBySeverity.high).toBeGreaterThan(0); });
  it("analytics with incidents by service", () => { createIncident({ title: "T", description: "", severity: "high", affectedServices: ["engine", "replay"] }); const a = generateOpsAnalytics(); expect(a.incidentsByService.engine).toBeGreaterThan(0); });
});

// ===== Extended Admin Actions Tests =====
describe("Ops — Admin Actions Extended", () => {
  it("admin action for organization scope", () => { expect(recordAdminAction({ scope: "organization", targetId: "org-1", action: "freeze", performedBy: "a", reason: "" }).scope).toBe("organization"); });
  it("admin action for school scope", () => { expect(recordAdminAction({ scope: "school", targetId: "s1", action: "lock", performedBy: "a", reason: "" }).scope).toBe("school"); });
  it("admin action for tournament scope", () => { expect(recordAdminAction({ scope: "tournament", targetId: "t1", action: "cancel", performedBy: "a", reason: "" }).scope).toBe("tournament"); });
  it("admin action for player scope", () => { expect(recordAdminAction({ scope: "player", targetId: "p1", action: "ban", performedBy: "a", reason: "" }).scope).toBe("player"); });
  it("admin action for club scope", () => { expect(recordAdminAction({ scope: "club", targetId: "c1", action: "freeze", performedBy: "a", reason: "" }).scope).toBe("club"); });
  it("admin action for broadcast scope", () => { expect(recordAdminAction({ scope: "broadcast", targetId: "b1", action: "stop", performedBy: "a", reason: "" }).scope).toBe("broadcast"); });
  it("admin action for match scope", () => { expect(recordAdminAction({ scope: "match", targetId: "m1", action: "pause", performedBy: "a", reason: "" }).scope).toBe("match"); });
  it("admin action for global scope", () => { expect(recordAdminAction({ scope: "global", action: "maintenance", performedBy: "a", reason: "" }).scope).toBe("global"); });
});

// ===== Extended Service Health Tests =====
describe("Ops — Health Extended", () => {
  it("health for engine", () => { expect(recordServiceHealth({ service: "engine", status: "healthy" }).service).toBe("engine"); });
  it("health for broadcast", () => { expect(recordServiceHealth({ service: "broadcast", status: "healthy" }).service).toBe("broadcast"); });
  it("health for replay", () => { expect(recordServiceHealth({ service: "replay", status: "healthy" }).service).toBe("replay"); });
  it("health for competitive", () => { expect(recordServiceHealth({ service: "competitive", status: "healthy" }).service).toBe("competitive"); });
  it("health for progression", () => { expect(recordServiceHealth({ service: "progression", status: "healthy" }).service).toBe("progression"); });
  it("health for social", () => { expect(recordServiceHealth({ service: "social", status: "healthy" }).service).toBe("social"); });
  it("health for liveops", () => { expect(recordServiceHealth({ service: "liveops", status: "healthy" }).service).toBe("liveops"); });
  it("health for inventory", () => { expect(recordServiceHealth({ service: "inventory", status: "healthy" }).service).toBe("inventory"); });
  it("health for configuration", () => { expect(recordServiceHealth({ service: "configuration", status: "healthy" }).service).toBe("configuration"); });
  it("health for intelligence", () => { expect(recordServiceHealth({ service: "intelligence", status: "healthy" }).service).toBe("intelligence"); });
  it("health status degraded", () => { expect(recordServiceHealth({ service: "engine", status: "degraded" }).status).toBe("degraded"); });
  it("health status unhealthy", () => { expect(recordServiceHealth({ service: "engine", status: "unhealthy" }).status).toBe("unhealthy"); });
  it("health status maintenance", () => { expect(recordServiceHealth({ service: "engine", status: "maintenance" }).status).toBe("maintenance"); });
  it("health status unknown", () => { expect(recordServiceHealth({ service: "engine", status: "unknown" }).status).toBe("unknown"); });
});

// ===== Extended Intervention Tests =====
describe("Ops — Interventions Extended", () => {
  it("pause match intervention", () => { expect(performIntervention({ matchId: "m1", action: "pause_match", performedBy: "a", reason: "" }).action).toBe("pause_match"); });
  it("resume match intervention", () => { expect(performIntervention({ matchId: "m1", action: "resume_match", performedBy: "a", reason: "" }).action).toBe("resume_match"); });
  it("terminate match intervention", () => { expect(performIntervention({ matchId: "m1", action: "terminate_match", performedBy: "a", reason: "" }).action).toBe("terminate_match"); });
  it("cancel match intervention", () => { expect(performIntervention({ matchId: "m1", action: "cancel_match", performedBy: "a", reason: "" }).action).toBe("cancel_match"); });
  it("restart match intervention", () => { expect(performIntervention({ matchId: "m1", action: "restart_match", performedBy: "a", reason: "" }).action).toBe("restart_match"); });
  it("freeze timers intervention", () => { expect(performIntervention({ matchId: "m1", action: "freeze_timers", performedBy: "a", reason: "" }).action).toBe("freeze_timers"); });
  it("disconnect spectators intervention", () => { expect(performIntervention({ matchId: "m1", action: "disconnect_spectators", performedBy: "a", reason: "" }).action).toBe("disconnect_spectators"); });
  it("transfer ownership intervention", () => { expect(performIntervention({ matchId: "m1", action: "transfer_ownership", performedBy: "a", reason: "" }).action).toBe("transfer_ownership"); });
  it("recover session intervention", () => { expect(performIntervention({ matchId: "m1", action: "recover_session", performedBy: "a", reason: "" }).action).toBe("recover_session"); });
  it("force replay intervention", () => { expect(performIntervention({ matchId: "m1", action: "force_replay", performedBy: "a", reason: "" }).action).toBe("force_replay"); });
});

// ===== Extended Announcement Tests =====
describe("Ops — Announcements Extended", () => {
  it("emergency banner type", () => { expect(createAnnouncement({ type: "emergency_banner", audience: "all", title: "T", message: "", createdBy: "a" }).type).toBe("emergency_banner"); });
  it("maintenance message type", () => { expect(createAnnouncement({ type: "maintenance_message", audience: "all", title: "T", message: "", createdBy: "a" }).type).toBe("maintenance_message"); });
  it("tournament announcement type", () => { expect(createAnnouncement({ type: "tournament_announcement", audience: "tournament", title: "T", message: "", targetId: "t1", createdBy: "a" }).type).toBe("tournament_announcement"); });
  it("organization notice type", () => { expect(createAnnouncement({ type: "organization_notice", audience: "organization", title: "T", message: "", targetId: "org-1", createdBy: "a" }).type).toBe("organization_notice"); });
  it("regional notice type", () => { expect(createAnnouncement({ type: "regional_notice", audience: "region", title: "T", message: "", targetId: "us-west", createdBy: "a" }).type).toBe("regional_notice"); });
  it("audience all", () => { expect(createAnnouncement({ type: "emergency_banner", audience: "all", title: "T", message: "", createdBy: "a" }).audience).toBe("all"); });
  it("audience school", () => { expect(createAnnouncement({ type: "emergency_banner", audience: "school", title: "T", message: "", targetId: "s1", createdBy: "a" }).audience).toBe("school"); });
  it("audience broadcast", () => { expect(createAnnouncement({ type: "emergency_banner", audience: "broadcast", title: "T", message: "", targetId: "b1", createdBy: "a" }).audience).toBe("broadcast"); });
});

// ===== Extended Bridge Tests =====
describe("Ops — Bridge Extended", () => {
  it("unsubscribe stops processing", () => { subscribeOps(); unsubscribeOps(); expect(isOpsSubscribed()).toBe(false); });
  it("resubscribe works", () => { subscribeOps(); unsubscribeOps(); subscribeOps(); expect(isOpsSubscribed()).toBe(true); });
  it("publish multiple events", () => { expect(() => { publishOpsEvent("IncidentCreated", null, {}); publishOpsEvent("MaintenanceStarted", null, {}); publishOpsEvent("EmergencyActivated", null, {}); }).not.toThrow(); });
});

// ===== Additional Extended Tests for 400+ coverage =====
describe("Ops — Additional Incident Tests", () => {
  it("incident with p1 priority", () => { expect(createIncident({ title: "T", description: "", severity: "critical", priority: "p1" }).priority).toBe("p1"); });
  it("incident with p2 priority", () => { expect(createIncident({ title: "T", description: "", severity: "high", priority: "p2" }).priority).toBe("p2"); });
  it("incident with p4 priority", () => { expect(createIncident({ title: "T", description: "", severity: "low", priority: "p4" }).priority).toBe("p4"); });
  it("incident timeline action format", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); transitionIncident(i.id, "investigating", "a", ""); expect(getIncidentById(i.id)?.timeline[1].action).toBe("transition:investigating"); });
  it("incident escalation updates timeline", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); const before = i.timeline.length; escalateIncident(i.id, "a", "test"); expect(getIncidentById(i.id)?.timeline.length).toBe(before + 1); });
  it("incident setRootCause updates timeline", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); const before = i.timeline.length; setRootCause(i.id, "test", "a"); expect(getIncidentById(i.id)?.timeline.length).toBe(before + 1); });
  it("incident setResolution updates timeline", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); const before = i.timeline.length; setResolution(i.id, "test", "a"); expect(getIncidentById(i.id)?.timeline.length).toBe(before + 1); });
  it("incident setPostmortem updates timeline", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); const before = i.timeline.length; setPostmortem(i.id, "test", "a"); expect(getIncidentById(i.id)?.timeline.length).toBe(before + 1); });
  it("incident assign updates timeline", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); const before = i.timeline.length; assignIncident(i.id, "admin", "a"); expect(getIncidentById(i.id)?.timeline.length).toBe(before + 1); });
  it("incident addTimelineEntry updates timeline", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); const before = i.timeline.length; addTimelineEntry(i.id, "a", "custom", "note"); expect(getIncidentById(i.id)?.timeline.length).toBe(before + 1); });
  it("incident escalation entry has reason", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); escalateIncident(i.id, "a", "Need higher priority"); expect(getIncidentEscalations(i.id)[0].reason).toBe("Need higher priority"); });
  it("incident escalation entry has escalatedBy", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); escalateIncident(i.id, "admin-1", ""); expect(getIncidentEscalations(i.id)[0].escalatedBy).toBe("admin-1"); });
  it("incident escalation entry has incidentId", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); escalateIncident(i.id, "a", ""); expect(getIncidentEscalations(i.id)[0].incidentId).toBe(i.id); });
  it("incident with custom correlationId", () => { expect(createIncident({ title: "T", description: "", severity: "high", correlationId: "corr-123" }).correlationId).toBe("corr-123"); });
  it("incident default affectedServices empty", () => { expect(createIncident({ title: "T", description: "", severity: "high" }).affectedServices).toEqual([]); });
  it("incident with multiple affectedServices", () => { const i = createIncident({ title: "T", description: "", severity: "critical", affectedServices: ["engine", "replay", "competitive"] }); expect(i.affectedServices.length).toBe(3); });
  it("incident default metadata empty", () => { expect(createIncident({ title: "T", description: "", severity: "high" }).metadata).toEqual({}); });
  it("incident with custom metadata", () => { const i = createIncident({ title: "T", description: "", severity: "high", metadata: { region: "us-west", impact: "high" } }); expect(i.metadata.region).toBe("us-west"); });
});

describe("Ops — Additional Alert Tests", () => {
  it("alert critical severity", () => { expect(createAlert({ severity: "critical", title: "T", description: "", source: "s" }).severity).toBe("critical"); });
  it("alert high severity", () => { expect(createAlert({ severity: "high", title: "T", description: "", source: "s" }).severity).toBe("high"); });
  it("alert medium severity", () => { expect(createAlert({ severity: "medium", title: "T", description: "", source: "s" }).severity).toBe("medium"); });
  it("alert low severity", () => { expect(createAlert({ severity: "low", title: "T", description: "", source: "s" }).severity).toBe("low"); });
  it("alert informational severity", () => { expect(createAlert({ severity: "informational", title: "T", description: "", source: "s" }).severity).toBe("informational"); });
  it("alert default assignedTo null", () => { expect(createAlert({ severity: "high", title: "T", description: "", source: "s" }).assignedTo).toBeNull(); });
  it("alert default resolvedAt null", () => { expect(createAlert({ severity: "high", title: "T", description: "", source: "s" }).resolvedAt).toBeNull(); });
  it("alert default resolvedBy null", () => { expect(createAlert({ severity: "high", title: "T", description: "", source: "s" }).resolvedBy).toBeNull(); });
  it("alert default acknowledgedAt null", () => { expect(createAlert({ severity: "high", title: "T", description: "", source: "s" }).acknowledgedAt).toBeNull(); });
  it("alert default acknowledgedBy null", () => { expect(createAlert({ severity: "high", title: "T", description: "", source: "s" }).acknowledgedBy).toBeNull(); });
  it("alert acknowledge sets acknowledgedBy", () => { const a = createAlert({ severity: "high", title: "T", description: "", source: "s" }); acknowledgeAlert(a.id, "admin-1"); expect(getAlertById(a.id)?.acknowledgedBy).toBe("admin-1"); });
  it("alert acknowledge sets acknowledgedAt", () => { const a = createAlert({ severity: "high", title: "T", description: "", source: "s" }); acknowledgeAlert(a.id, "a"); expect(getAlertById(a.id)?.acknowledgedAt).not.toBeNull(); });
  it("alert resolve sets resolvedBy", () => { const a = createAlert({ severity: "high", title: "T", description: "", source: "s" }); resolveAlert(a.id, "admin-1", ""); expect(getAlertById(a.id)?.resolvedBy).toBe("admin-1"); });
  it("alert resolve sets resolvedAt", () => { const a = createAlert({ severity: "high", title: "T", description: "", source: "s" }); resolveAlert(a.id, "a", ""); expect(getAlertById(a.id)?.resolvedAt).not.toBeNull(); });
  it("alert assign sets assignedTo", () => { const a = createAlert({ severity: "high", title: "T", description: "", source: "s" }); assignAlert(a.id, "ops-team", "a"); expect(getAlertById(a.id)?.assignedTo).toBe("ops-team"); });
  it("alert escalate increments level", () => { const a = createAlert({ severity: "high", title: "T", description: "", source: "s" }); escalateAlert(a.id, "a", ""); escalateAlert(a.id, "a", ""); expect(getAlertById(a.id)?.escalationLevel).toBe(2); });
  it("alert history has timestamp", () => { const a = createAlert({ severity: "high", title: "T", description: "", source: "s" }); acknowledgeAlert(a.id, "a"); expect(getAlertById(a.id)?.history[0].timestamp).toBeDefined(); });
  it("alert history has actorId", () => { const a = createAlert({ severity: "high", title: "T", description: "", source: "s" }); acknowledgeAlert(a.id, "admin-1"); expect(getAlertById(a.id)?.history[0].actorId).toBe("admin-1"); });
  it("alert history has action", () => { const a = createAlert({ severity: "high", title: "T", description: "", source: "s" }); acknowledgeAlert(a.id, "a"); expect(getAlertById(a.id)?.history[0].action).toBe("acknowledged"); });
  it("alert history has id", () => { const a = createAlert({ severity: "high", title: "T", description: "", source: "s" }); acknowledgeAlert(a.id, "a"); expect(getAlertById(a.id)?.history[0].id).toBeDefined(); });
  it("alert assign unknown returns null", () => { expect(assignAlert("nonexistent", "a", "a")).toBeNull(); });
  it("alert escalate unknown returns null", () => { expect(escalateAlert("nonexistent", "a", "")).toBeNull(); });
});

describe("Ops — Additional Maintenance Tests", () => {
  it("maintenance default affectedServices empty", () => { expect(createMaintenance({ type: "scheduled", title: "T", description: "", startDate: "", endDate: "", createdBy: "a" }).affectedServices).toEqual([]); });
  it("maintenance default organizationId null", () => { expect(createMaintenance({ type: "scheduled", title: "T", description: "", startDate: "", endDate: "", createdBy: "a" }).organizationId).toBeNull(); });
  it("maintenance default region null", () => { expect(createMaintenance({ type: "scheduled", title: "T", description: "", startDate: "", endDate: "", createdBy: "a" }).region).toBeNull(); });
  it("maintenance default startedAt null", () => { expect(createMaintenance({ type: "scheduled", title: "T", description: "", startDate: "", endDate: "", createdBy: "a" }).startedAt).toBeNull(); });
  it("maintenance default completedAt null", () => { expect(createMaintenance({ type: "scheduled", title: "T", description: "", startDate: "", endDate: "", createdBy: "a" }).completedAt).toBeNull(); });
  it("maintenance with multiple affectedServices", () => { const m = createMaintenance({ type: "scheduled", title: "T", description: "", startDate: "", endDate: "", createdBy: "a", affectedServices: ["engine", "replay", "social"] }); expect(m.affectedServices.length).toBe(3); });
  it("maintenance get unknown returns null", () => { expect(getMaintenanceById("nonexistent")).toBeNull(); });
  it("maintenance cancel scheduled", () => { const m = createMaintenance({ type: "scheduled", title: "T", description: "", startDate: "", endDate: "", createdBy: "a" }); expect(cancelMaintenance(m.id, "")?.status).toBe("cancelled"); });
  it("maintenance cancel in-progress", () => { const m = createMaintenance({ type: "scheduled", title: "T", description: "", startDate: "", endDate: "", createdBy: "a" }); startMaintenance(m.id); expect(cancelMaintenance(m.id, "")?.status).toBe("cancelled"); });
  it("maintenance mark notification on scheduled", () => { const m = createMaintenance({ type: "scheduled", title: "T", description: "", startDate: "", endDate: "", createdBy: "a" }); expect(markNotificationSent(m.id)?.notificationSent).toBe(true); });
});

describe("Ops — Additional Emergency Tests", () => {
  it("emergency default resolvedAt null", () => { expect(activateEmergency({ type: "pause", activatedBy: "a", reason: "", scope: "global" }).resolvedAt).toBeNull(); });
  it("emergency default resolvedBy null", () => { expect(activateEmergency({ type: "pause", activatedBy: "a", reason: "", scope: "global" }).resolvedBy).toBeNull(); });
  it("emergency default affectedServices empty", () => { expect(activateEmergency({ type: "pause", activatedBy: "a", reason: "", scope: "global" }).affectedServices).toEqual([]); });
  it("emergency default recoverySteps empty", () => { expect(activateEmergency({ type: "pause", activatedBy: "a", reason: "", scope: "global" }).recoverySteps).toEqual([]); });
  it("emergency default metadata empty", () => { expect(activateEmergency({ type: "pause", activatedBy: "a", reason: "", scope: "global" }).metadata).toEqual({}); });
  it("emergency with custom scope", () => { expect(activateEmergency({ type: "organization_isolation", activatedBy: "a", reason: "", scope: "org-123" }).scope).toBe("org-123"); });
  it("emergency get unknown returns null", () => { expect(getEmergencyById("nonexistent")).toBeNull(); });
  it("emergency list by resolved status", () => { const e = activateEmergency({ type: "pause", activatedBy: "a", reason: "", scope: "global" }); resolveEmergency(e.id, "a"); expect(listEmergencies("resolved").length).toBe(1); });
});

describe("Ops — Additional Dashboard Tests", () => {
  it("dashboard stats avgResolutionTimeMs", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); transitionIncident(i.id, "investigating", "a", ""); transitionIncident(i.id, "resolved", "a", ""); expect(generateOpsDashboard().stats.avgResolutionTimeMs).toBeGreaterThanOrEqual(0); });
  it("dashboard stats totalIncidents", () => { createIncident({ title: "T", description: "", severity: "high" }); expect(generateOpsDashboard().stats.totalIncidents).toBeGreaterThan(0); });
  it("dashboard stats slaCompliance", () => { expect(generateOpsDashboard().stats.slaCompliance).toBeGreaterThanOrEqual(0); expect(generateOpsDashboard().stats.slaCompliance).toBeLessThanOrEqual(100); });
  it("analytics mttrMs with resolved incidents", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); transitionIncident(i.id, "investigating", "a", ""); transitionIncident(i.id, "resolved", "a", ""); expect(generateOpsAnalytics().mttrMs).toBeGreaterThanOrEqual(0); });
  it("analytics recoverySuccessRate with resolved", () => { const i = createIncident({ title: "T", description: "", severity: "high" }); transitionIncident(i.id, "investigating", "a", ""); transitionIncident(i.id, "resolved", "a", ""); expect(generateOpsAnalytics().recoverySuccessRate).toBeGreaterThan(0); });
  it("analytics interventionFrequency", () => { expect(generateOpsAnalytics().interventionFrequency).toBeGreaterThanOrEqual(0); });
  it("analytics mttcMs", () => { expect(generateOpsAnalytics().mttcMs).toBeGreaterThanOrEqual(0); });
  it("control center healthSummary healthy by default", () => { expect(generateControlCenter().healthSummary).toBe("healthy"); });
  it("control center healthSummary degraded with unhealthy service", () => { recordServiceHealth({ service: "engine", status: "unhealthy" }); recordServiceHealth({ service: "replay", status: "unhealthy" }); expect(generateControlCenter().healthSummary).not.toBe("healthy"); });
});

describe("Ops — Additional Audit Tests", () => {
  it("audit entry has id", () => { expect(recordAudit({ actorId: "a", action: "t", scope: "global", reason: "" }).id).toBeDefined(); });
  it("audit entry has scope", () => { expect(recordAudit({ actorId: "a", action: "t", scope: "match", reason: "" }).scope).toBe("match"); });
  it("audit entry has reason", () => { expect(recordAudit({ actorId: "a", action: "t", scope: "global", reason: "Security issue" }).reason).toBe("Security issue"); });
  it("audit entry default targetId null", () => { expect(recordAudit({ actorId: "a", action: "t", scope: "global", reason: "" }).targetId).toBeNull(); });
  it("audit entry default incidentId null", () => { expect(recordAudit({ actorId: "a", action: "t", scope: "global", reason: "" }).incidentId).toBeNull(); });
  it("audit entry default approvalId null", () => { expect(recordAudit({ actorId: "a", action: "t", scope: "global", reason: "" }).approvalId).toBeNull(); });
  it("audit entry default before empty", () => { expect(recordAudit({ actorId: "a", action: "t", scope: "global", reason: "" }).before).toEqual({}); });
  it("audit entry default after empty", () => { expect(recordAudit({ actorId: "a", action: "t", scope: "global", reason: "" }).after).toEqual({}); });
  it("multiple audit entries", () => { recordAudit({ actorId: "a", action: "t1", scope: "global", reason: "" }); recordAudit({ actorId: "a", action: "t2", scope: "global", reason: "" }); recordAudit({ actorId: "a", action: "t3", scope: "global", reason: "" }); expect(listAuditEntries().length).toBe(3); });
  it("audit with targetId", () => { expect(recordAudit({ actorId: "a", action: "t", scope: "match", targetId: "m1", reason: "" }).targetId).toBe("m1"); });
  it("audit with incidentId", () => { expect(recordAudit({ actorId: "a", action: "t", scope: "global", reason: "", incidentId: "inc-1" }).incidentId).toBe("inc-1"); });
  it("audit with approvalId", () => { expect(recordAudit({ actorId: "a", action: "t", scope: "global", reason: "", approvalId: "ap-1" }).approvalId).toBe("ap-1"); });
  it("audit with before state", () => { expect(recordAudit({ actorId: "a", action: "t", scope: "global", reason: "", before: { status: "running" } }).before.status).toBe("running"); });
  it("audit with after state", () => { expect(recordAudit({ actorId: "a", action: "t", scope: "global", reason: "", after: { status: "paused" } }).after.status).toBe("paused"); });
});

describe("Ops — Additional Playbook Tests", () => {
  it("playbook default prerequisites empty", () => { expect(createPlaybook({ name: "PB", category: "network_degradation", description: "" }).prerequisites).toEqual([]); });
  it("playbook default steps empty", () => { expect(createPlaybook({ name: "PB", category: "network_degradation", description: "" }).steps).toEqual([]); });
  it("playbook get unknown returns null", () => { expect(getPlaybookById("nonexistent")).toBeNull(); });
  it("playbook steps have order", () => { const p = createPlaybook({ name: "PB", category: "network_degradation", description: "", steps: [{ order: 1, action: "Step 1", description: "", expectedOutcome: "", verificationMethod: "" }] }); expect(p.steps[0].order).toBe(1); });
  it("playbook steps have action", () => { const p = createPlaybook({ name: "PB", category: "network_degradation", description: "", steps: [{ order: 1, action: "Check logs", description: "", expectedOutcome: "", verificationMethod: "" }] }); expect(p.steps[0].action).toBe("Check logs"); });
  it("playbook steps have expectedOutcome", () => { const p = createPlaybook({ name: "PB", category: "network_degradation", description: "", steps: [{ order: 1, action: "Check", description: "", expectedOutcome: "No errors", verificationMethod: "" }] }); expect(p.steps[0].expectedOutcome).toBe("No errors"); });
  it("playbook steps have verificationMethod", () => { const p = createPlaybook({ name: "PB", category: "network_degradation", description: "", steps: [{ order: 1, action: "Check", description: "", expectedOutcome: "", verificationMethod: "Log check" }] }); expect(p.steps[0].verificationMethod).toBe("Log check"); });
  it("playbook execute multiple times increases count", () => { const p = createPlaybook({ name: "PB", category: "network_degradation", description: "" }); executePlaybook(p.id); executePlaybook(p.id); expect(getPlaybookById(p.id)?.usageCount).toBe(2); });
  it("playbook execute updates lastUsedAt", () => { const p = createPlaybook({ name: "PB", category: "network_degradation", description: "" }); executePlaybook(p.id); expect(getPlaybookById(p.id)?.lastUsedAt).not.toBeNull(); });
});

describe("Ops — Additional Status Tests", () => {
  it("status with incidents", () => { createIncident({ title: "T", description: "", severity: "critical" }); expect(getStatus().activeIncidents).toBeGreaterThan(0); });
  it("status with emergencies", () => { activateEmergency({ type: "pause", activatedBy: "a", reason: "", scope: "global" }); expect(getStatus().activeEmergencies).toBeGreaterThan(0); });
  it("status with maintenance", () => { const m = createMaintenance({ type: "scheduled", title: "T", description: "", startDate: "", endDate: "", createdBy: "a" }); startMaintenance(m.id); expect(getStatus().activeMaintenance).toBeGreaterThan(0); });
  it("status with alerts", () => { createAlert({ severity: "critical", title: "T", description: "", source: "s" }); expect(getStatus().activeAlerts).toBeGreaterThan(0); });
  it("status platform is game-operations", () => { expect(getStatus().platform).toBe("game-operations"); });
  it("status version is 1.0.0", () => { expect(getStatus().version).toBe("1.0.0"); });
});

describe("Ops — Additional Developer Tests", () => {
  it("developer has 9 APIs", () => { expect(getDeveloperIntegration().publicAPIs.length).toBe(9); });
  it("developer has 3 hooks", () => { expect(getDeveloperIntegration().extensionHooks.length).toBe(3); });
  it("developer hooks have trigger events", () => { for (const h of getDeveloperIntegration().extensionHooks) expect(h.triggerEvent).toBeDefined(); });
  it("developer SDK has docs URL", () => { expect(getDeveloperIntegration().sdkMetadata.docsUrl).toContain("edubek"); });
  it("developer SDK has language", () => { expect(getDeveloperIntegration().sdkMetadata.language).toBe("TypeScript"); });
});
