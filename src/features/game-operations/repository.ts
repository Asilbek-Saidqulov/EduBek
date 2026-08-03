/** In-memory repository for Game Operations Platform. */
import type {
  Incident, IncidentEscalation, MaintenanceWindow, EmergencyOperation,
  MatchIntervention, Playbook, AdminAction, ServiceHealth,
  OperationalAlert, Announcement, AuditEntry,
} from "./types";

const incidents = new Map<string, Incident>();
const escalations = new Map<string, IncidentEscalation[]>();
const maintenance = new Map<string, MaintenanceWindow>();
const emergencies = new Map<string, EmergencyOperation>();
const interventions = new Map<string, MatchIntervention[]>();
const playbooks = new Map<string, Playbook>();
const adminActions = new Map<string, AdminAction[]>();
const serviceHealth = new Map<string, ServiceHealth>();
const alerts = new Map<string, OperationalAlert>();
const announcements = new Map<string, Announcement>();
const auditEntries = new Map<string, AuditEntry[]>();

export const storeIncident = (i: Incident) => incidents.set(i.id, i);
export const getIncident = (id: string) => incidents.get(id) ?? null;
export const getAllIncidents = () => Array.from(incidents.values());
export const storeEscalation = (e: IncidentEscalation) => { const l = escalations.get(e.incidentId) ?? []; l.push(e); escalations.set(e.incidentId, l); };
export const getEscalations = (incidentId: string) => escalations.get(incidentId) ?? [];
export const storeMaintenance = (m: MaintenanceWindow) => maintenance.set(m.id, m);
export const getMaintenance = (id: string) => maintenance.get(id) ?? null;
export const getAllMaintenance = () => Array.from(maintenance.values());
export const storeEmergency = (e: EmergencyOperation) => emergencies.set(e.id, e);
export const getEmergency = (id: string) => emergencies.get(id) ?? null;
export const getAllEmergencies = () => Array.from(emergencies.values());
export const storeIntervention = (i: MatchIntervention) => { const l = interventions.get(i.matchId) ?? []; l.push(i); interventions.set(i.matchId, l); };
export const getInterventions = (matchId: string) => interventions.get(matchId) ?? [];
export const storePlaybook = (p: Playbook) => playbooks.set(p.id, p);
export const getPlaybook = (id: string) => playbooks.get(id) ?? null;
export const getAllPlaybooks = () => Array.from(playbooks.values());
export const storeAdminAction = (a: AdminAction) => { const l = adminActions.get("all") ?? []; l.push(a); adminActions.set("all", l); };
export const getAdminActions = () => adminActions.get("all") ?? [];
export const storeServiceHealth = (h: ServiceHealth) => serviceHealth.set(h.service, h);
export const getServiceHealth = (service: string) => serviceHealth.get(service) ?? null;
export const getAllServiceHealth = () => Array.from(serviceHealth.values());
export const storeAlert = (a: OperationalAlert) => alerts.set(a.id, a);
export const getAlert = (id: string) => alerts.get(id) ?? null;
export const getAllAlerts = () => Array.from(alerts.values());
export const storeAnnouncement = (a: Announcement) => announcements.set(a.id, a);
export const getAnnouncement = (id: string) => announcements.get(id) ?? null;
export const getAllAnnouncements = () => Array.from(announcements.values());
export const storeAudit = (a: AuditEntry) => { const l = auditEntries.get("all") ?? []; l.push(a); auditEntries.set("all", l); };
export const getAuditEntries = () => auditEntries.get("all") ?? [];

export function _resetRepositoryForTesting() {
  incidents.clear(); escalations.clear(); maintenance.clear(); emergencies.clear();
  interventions.clear(); playbooks.clear(); adminActions.clear(); serviceHealth.clear();
  alerts.clear(); announcements.clear(); auditEntries.clear();
}
