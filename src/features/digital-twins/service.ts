/**
 * EduBek — Digital Twins main service.
 *
 * Phase 5A.1: Public-facing service composing all digital twin
 * subsystems into a unified API surface.
 */
import { getLogger } from "@/lib/logger";
import { syncClassroomTwin, getClassroomTwin } from "./classroom-twin";
import { syncStudentTwin, getStudentTwin } from "./student-twin";
import { syncTeacherTwin, getTeacherTwin } from "./teacher-twin";
import { syncInstitutionTwin, getInstitutionTwin } from "./institution-twin";
import * as calendar from "./calendar-engine";
import { prepareNextWeek, executeAutonomousInstruction } from "./autonomous-assistant";
import * as workflows from "./academic-workflows";
import * as memory from "./academic-memory";
import * as scenarios from "./scenario-planning";
import * as opsCenter from "./operations-center";
import * as repo from "./repository";
import type { DigitalTwinDto } from "./types";

const log = getLogger("digital-twins");

// ---------------------------------------------------------------------------
// Twin sync
// ---------------------------------------------------------------------------

export async function syncTwin(twinType: "classroom" | "student" | "teacher" | "institution", entityId: string): Promise<DigitalTwinDto> {
  switch (twinType) {
    case "classroom": return syncClassroomTwin(entityId);
    case "student": return syncStudentTwin(entityId);
    case "teacher": return syncTeacherTwin(entityId);
    case "institution": return syncInstitutionTwin(entityId);
  }
}

export async function getTwin(twinType: "classroom" | "student" | "teacher" | "institution", entityId: string, autoSync = true): Promise<DigitalTwinDto | null> {
  switch (twinType) {
    case "classroom": return getClassroomTwin(entityId, autoSync);
    case "student": return getStudentTwin(entityId, autoSync);
    case "teacher": return getTeacherTwin(entityId, autoSync);
    case "institution": return getInstitutionTwin(entityId, autoSync);
  }
}

export async function listTwinsByType(twinType: "classroom" | "student" | "teacher" | "institution", limit = 100) {
  const rows = await repo.findTwinsByType(twinType, limit);
  return rows.map((t: any) => ({
    id: t.id,
    twinType: t.twinType,
    entityId: t.entityId,
    state: safeParse(t.state),
    version: t.version,
    lastSyncedAt: t.lastSyncedAt?.toISOString() ?? null,
    active: t.active,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));
}

// ---------------------------------------------------------------------------
// Twin snapshots (historical)
// ---------------------------------------------------------------------------

export async function getTwinHistory(input: {
  twinType: "classroom" | "student" | "teacher" | "institution";
  entityId: string;
  days?: number;
}) {
  const to = new Date();
  const from = new Date(Date.now() - (input.days ?? 30) * 24 * 60 * 60 * 1000);
  const snapshots = await repo.findTwinSnapshots({
    twinType: input.twinType,
    entityId: input.entityId,
    from,
    to,
    limit: input.days ?? 30,
  });
  return snapshots.map((s: any) => ({
    id: s.id,
    twinType: s.twinType,
    entityId: s.entityId,
    day: s.day.toISOString(),
    state: safeParse(s.state),
    trigger: s.trigger,
    createdAt: s.createdAt.toISOString(),
  }));
}

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------

export { syncClassroomTwin, getClassroomTwin } from "./classroom-twin";
export { syncStudentTwin, getStudentTwin } from "./student-twin";
export { syncTeacherTwin, getTeacherTwin } from "./teacher-twin";
export { syncInstitutionTwin, getInstitutionTwin } from "./institution-twin";

// Calendar
export {
  createCalendar,
  getCalendar,
  listCalendars,
  activateCalendar,
  addCalendarEvent,
  listCalendarEvents,
  removeCalendarEvent,
  getUpcomingEventsForScope,
  getHolidaysInRange,
  isWorkingDay,
} from "./calendar-engine";

// Autonomous assistant
export { prepareNextWeek, executeAutonomousInstruction } from "./autonomous-assistant";

// Academic workflows
export {
  triggerWorkflow,
  getWorkflow,
  listWorkflows,
  listWorkflowTriggers,
} from "./academic-workflows";

// Academic memory
export {
  storeAcademicMemory,
  recallAcademicMemory,
  getStudentTrajectory,
  getClassroomHistory,
  getAcademicMemoryById,
} from "./academic-memory";

// Scenario planning
export {
  runScenario,
  getScenario,
  listScenarios,
} from "./scenario-planning";

// Operations center
export {
  generateOperations,
  getOperations,
  acknowledgeOperation,
  resolveOperation,
  dismissOperation,
} from "./operations-center";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeParse(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}
