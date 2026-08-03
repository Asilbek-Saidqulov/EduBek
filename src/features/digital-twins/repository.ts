/**
 * EduBek — Digital Twins repository.
 *
 * Direct Prisma access for the Phase 5A.1 models:
 *   DigitalTwin, TwinSnapshot, AcademicCalendar, CalendarEvent,
 *   AcademicWorkflow, AcademicMemory, ScenarioPlan, AcademicOperation.
 */
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// Digital Twins
// ---------------------------------------------------------------------------

export async function findTwin(twinType: string, entityId: string) {
  return db.digitalTwin.findUnique({
    where: { twinType_entityId: { twinType, entityId } },
  });
}

export async function upsertTwin(input: {
  twinType: string;
  entityId: string;
  state?: string;
  lastSyncedAt?: Date;
  active?: boolean;
}) {
  const existing = await db.digitalTwin.findUnique({
    where: { twinType_entityId: { twinType: input.twinType, entityId: input.entityId } },
  });
  if (existing) {
    return db.digitalTwin.update({
      where: { id: existing.id },
      data: {
        state: input.state ?? existing.state,
        lastSyncedAt: input.lastSyncedAt ?? existing.lastSyncedAt,
        active: input.active ?? existing.active,
        version: { increment: 1 },
      },
    });
  }
  return db.digitalTwin.create({ data: input });
}

export async function findTwinsByType(twinType: string, limit = 100) {
  return db.digitalTwin.findMany({
    where: { twinType, active: true },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}

// ---------------------------------------------------------------------------
// Twin Snapshots
// ---------------------------------------------------------------------------

export async function createTwinSnapshot(input: {
  twinType: string;
  entityId: string;
  day: Date;
  state: string;
  trigger?: string;
}) {
  return db.twinSnapshot.upsert({
    where: {
      twinType_entityId_day: {
        twinType: input.twinType,
        entityId: input.entityId,
        day: input.day,
      },
    },
    create: input,
    update: { state: input.state, trigger: input.trigger },
  });
}

export async function findTwinSnapshots(input: {
  twinType: string;
  entityId: string;
  from?: Date;
  to?: Date;
  limit?: number;
}) {
  const where: Record<string, unknown> = {
    twinType: input.twinType,
    entityId: input.entityId,
  };
  if (input.from || input.to) {
    where.day = {};
    if (input.from) (where.day as any).gte = input.from;
    if (input.to) (where.day as any).lte = input.to;
  }
  return db.twinSnapshot.findMany({
    where,
    orderBy: { day: "desc" },
    take: input.limit ?? 90,
  });
}

// ---------------------------------------------------------------------------
// Academic Calendar
// ---------------------------------------------------------------------------

export async function createCalendar(input: {
  organizationId?: string;
  year: string;
  term?: string;
  startDate: Date;
  endDate: Date;
  schedule?: string;
  status?: string;
}) {
  return db.academicCalendar.create({ data: input });
}

export async function findCalendar(id: string) {
  return db.academicCalendar.findUnique({
    where: { id },
    include: { events: { orderBy: { startDate: "asc" } } },
  });
}

export async function findCalendars(input: {
  organizationId?: string;
  year?: string;
  status?: string;
  limit?: number;
}) {
  const { limit, ...where } = input;
  return db.academicCalendar.findMany({
    where,
    orderBy: { startDate: "desc" },
    take: limit ?? 20,
  });
}

export async function updateCalendar(id: string, data: Record<string, unknown>) {
  return db.academicCalendar.update({ where: { id }, data });
}

export async function findActiveCalendar(organizationId?: string): Promise<any | null> {
  return db.academicCalendar.findFirst({
    where: { organizationId, status: "active" },
    include: { events: { orderBy: { startDate: "asc" } } },
    orderBy: { startDate: "desc" },
  });
}

// ---------------------------------------------------------------------------
// Calendar Events
// ---------------------------------------------------------------------------

export async function createCalendarEvent(input: {
  calendarId: string;
  type: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  scopeType?: string;
  scopeId?: string;
  metadata?: string;
}) {
  return db.calendarEvent.create({ data: input });
}

export async function findCalendarEvents(input: {
  calendarId?: string;
  type?: string;
  scopeType?: string;
  scopeId?: string;
  from?: Date;
  to?: Date;
  limit?: number;
}) {
  const where: Record<string, unknown> = {};
  if (input.calendarId) where.calendarId = input.calendarId;
  if (input.type) where.type = input.type;
  if (input.scopeType) where.scopeType = input.scopeType;
  if (input.scopeId) where.scopeId = input.scopeId;
  if (input.from || input.to) {
    where.startDate = {};
    if (input.from) (where.startDate as any).gte = input.from;
    if (input.to) (where.startDate as any).lte = input.to;
  }
  return db.calendarEvent.findMany({
    where,
    orderBy: { startDate: "asc" },
    take: input.limit ?? 100,
  });
}

export async function deleteCalendarEvent(id: string) {
  return db.calendarEvent.delete({ where: { id } });
}

// ---------------------------------------------------------------------------
// Academic Workflows
// ---------------------------------------------------------------------------

export async function createAcademicWorkflow(input: {
  trigger: string;
  name: string;
  scopeType?: string;
  scopeId?: string;
  steps?: string;
  status?: string;
  triggerEntityId?: string;
}) {
  return db.academicWorkflow.create({ data: input });
}

export async function findAcademicWorkflow(id: string) {
  return db.academicWorkflow.findUnique({ where: { id } });
}

export async function findAcademicWorkflows(input: {
  trigger?: string;
  scopeType?: string;
  scopeId?: string;
  status?: string;
  limit?: number;
}) {
  const { limit, ...where } = input;
  return db.academicWorkflow.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit ?? 50,
  });
}

export async function updateAcademicWorkflow(id: string, data: Record<string, unknown>) {
  return db.academicWorkflow.update({ where: { id }, data });
}

// ---------------------------------------------------------------------------
// Academic Memory
// ---------------------------------------------------------------------------

export async function createAcademicMemory(input: {
  scopeType: string;
  scopeId: string;
  academicYear: string;
  type: string;
  summary: string;
  payload?: string;
  importance?: number;
}) {
  return db.academicMemory.create({ data: input });
}

export async function findAcademicMemories(input: {
  scopeType?: string;
  scopeId?: string;
  academicYear?: string;
  type?: string;
  limit?: number;
}) {
  const { limit, ...where } = input;
  return db.academicMemory.findMany({
    where,
    orderBy: [{ importance: "desc" }, { createdAt: "desc" }],
    take: limit ?? 100,
  });
}

export async function findAcademicMemoryById(id: string) {
  return db.academicMemory.findUnique({ where: { id } });
}

// ---------------------------------------------------------------------------
// Scenario Plans
// ---------------------------------------------------------------------------

export async function createScenarioPlan(input: {
  type: string;
  title: string;
  description?: string;
  parameters?: string;
  predictions?: string;
  affected?: string;
  estimatedCosts?: string;
  summary?: string;
  confidence?: number;
  createdBy?: string;
  status?: string;
}) {
  return db.scenarioPlan.create({ data: input });
}

export async function findScenarioPlan(id: string) {
  return db.scenarioPlan.findUnique({ where: { id } });
}

export async function findScenarioPlans(input: {
  type?: string;
  status?: string;
  createdBy?: string;
  limit?: number;
}) {
  const { limit, ...where } = input;
  return db.scenarioPlan.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit ?? 20,
  });
}

export async function updateScenarioPlan(id: string, data: Record<string, unknown>) {
  return db.scenarioPlan.update({ where: { id }, data });
}

// ---------------------------------------------------------------------------
// Academic Operations
// ---------------------------------------------------------------------------

export async function createAcademicOperation(input: {
  organizationId?: string;
  day: Date;
  priority?: number;
  type: string;
  title: string;
  description: string;
  entityType?: string;
  entityId?: string;
  reasoning?: string;
  confidence?: number;
}) {
  return db.academicOperation.create({ data: input });
}

export async function findAcademicOperations(input: {
  organizationId?: string;
  day?: Date;
  priority?: number;
  type?: string;
  status?: string;
  entityType?: string;
  entityId?: string;
  limit?: number;
}) {
  const { limit, ...where } = input;
  return db.academicOperation.findMany({
    where,
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    take: limit ?? 100,
  });
}

export async function updateAcademicOperation(id: string, data: Record<string, unknown>) {
  return db.academicOperation.update({ where: { id }, data });
}

export async function deleteAcademicOperations(organizationId: string, day: Date): Promise<number> {
  const result = await db.academicOperation.deleteMany({
    where: { organizationId, day, status: "open" },
  });
  return result.count;
}
