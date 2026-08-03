/**
 * EduBek — Proctoring feature barrel export.
 */
export {
  getAttemptSummary,
  listIncidents,
  getMyIncidents,
} from "./service";

export {
  listIncidentsQuerySchema,
  incidentTypeSchema,
  severitySchema,
  type ListIncidentsQuery,
} from "./schema";

export type {
  ProctoringIncidentType,
  ProctoringSeverity,
  ProctoringIncidentDto,
  ProctoringSummaryDto,
} from "./types";
