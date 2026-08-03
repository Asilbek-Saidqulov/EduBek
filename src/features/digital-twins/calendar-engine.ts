/**
 * EduBek — Academic Calendar Engine.
 *
 * Phase 5A.1: Manages semesters, holidays, exams, grading periods,
 * curriculum deadlines, and school/teacher schedules. The AI uses
 * the calendar to automatically plan work around academic events.
 *
 * Reuses:
 *   • Phase 4F.6 Education OS agents (for autonomous planning)
 *   • Phase 4F.3 Learning Planner (for scheduling around deadlines)
 */
import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { AcademicCalendarDto, CalendarEventDto, CalendarEventType } from "./types";

const log = getLogger("calendar-engine");

// ---------------------------------------------------------------------------
// Calendar CRUD
// ---------------------------------------------------------------------------

export async function createCalendar(input: {
  organizationId?: string;
  year: string;
  term?: string;
  startDate: string | Date;
  endDate: string | Date;
  schedule?: {
    holidays?: Array<{ date: string; name: string }>;
    gradingPeriods?: Array<{ start: string; end: string; name: string }>;
    examPeriods?: Array<{ start: string; end: string; name: string }>;
  };
}): Promise<AcademicCalendarDto> {
  const calendar = await repo.createCalendar({
    organizationId: input.organizationId,
    year: input.year,
    term: input.term,
    startDate: new Date(input.startDate),
    endDate: new Date(input.endDate),
    schedule: JSON.stringify(input.schedule ?? {}),
    status: "planned",
  });
  log.info("calendar.created", { id: calendar.id, year: input.year });
  return mapCalendar({ ...calendar, events: [] });
}

export async function getCalendar(id: string): Promise<AcademicCalendarDto | null> {
  const calendar = await repo.findCalendar(id);
  return calendar ? mapCalendar(calendar) : null;
}

export async function listCalendars(input: {
  organizationId?: string;
  year?: string;
  status?: string;
  limit?: number;
}): Promise<AcademicCalendarDto[]> {
  const calendars = await repo.findCalendars(input);
  return calendars.map((c) => mapCalendar({ ...c, events: [] }));
}

export async function activateCalendar(id: string): Promise<AcademicCalendarDto> {
  // Deactivate any other active calendars for the same org
  const calendar = await repo.findCalendar(id);
  if (calendar?.organizationId) {
    const activeCalendars = await repo.findCalendars({
      organizationId: calendar.organizationId,
      status: "active",
    });
    for (const ac of activeCalendars) {
      if (ac.id !== id) {
        await repo.updateCalendar(ac.id, { status: "completed" });
      }
    }
  }
  const updated = await repo.updateCalendar(id, { status: "active" });
  log.info("calendar.activated", { id });
  return mapCalendar({ ...updated, events: [] });
}

// ---------------------------------------------------------------------------
// Calendar Events
// ---------------------------------------------------------------------------

export async function addCalendarEvent(input: {
  calendarId: string;
  type: CalendarEventType;
  title: string;
  description?: string;
  startDate: string | Date;
  endDate?: string | Date;
  scopeType?: string;
  scopeId?: string;
  metadata?: Record<string, unknown>;
}): Promise<CalendarEventDto> {
  const event = await repo.createCalendarEvent({
    calendarId: input.calendarId,
    type: input.type,
    title: input.title,
    description: input.description,
    startDate: new Date(input.startDate),
    endDate: input.endDate ? new Date(input.endDate) : undefined,
    scopeType: input.scopeType,
    scopeId: input.scopeId,
    metadata: JSON.stringify(input.metadata ?? {}),
  });
  log.info("calendar.event_added", { calendarId: input.calendarId, type: input.type, title: input.title });
  return mapEvent(event);
}

export async function listCalendarEvents(input: {
  calendarId?: string;
  type?: CalendarEventType;
  scopeType?: string;
  scopeId?: string;
  from?: Date;
  to?: Date;
  limit?: number;
}): Promise<CalendarEventDto[]> {
  const events = await repo.findCalendarEvents(input);
  return events.map(mapEvent);
}

export async function removeCalendarEvent(id: string): Promise<void> {
  await repo.deleteCalendarEvent(id);
}

// ---------------------------------------------------------------------------
// Auto-planning: get upcoming events that affect a scope
// ---------------------------------------------------------------------------

export async function getUpcomingEventsForScope(input: {
  scopeType: string;
  scopeId: string;
  daysAhead?: number;
}): Promise<CalendarEventDto[]> {
  const from = new Date();
  const to = new Date(Date.now() + (input.daysAhead ?? 30) * 24 * 60 * 60 * 1000);
  const events = await repo.findCalendarEvents({
    scopeType: input.scopeType,
    scopeId: input.scopeId,
    from,
    to,
    limit: 50,
  });
  return events.map(mapEvent);
}

/**
 * Get all holidays within a date range — used by the autonomous
 * assistant to avoid scheduling work on holidays.
 */
export async function getHolidaysInRange(input: {
  calendarId?: string;
  from: Date;
  to: Date;
}): Promise<Array<{ date: string; name: string }>> {
  const holidayEvents = await repo.findCalendarEvents({
    calendarId: input.calendarId,
    type: "holiday",
    from: input.from,
    to: input.to,
    limit: 100,
  });
  return holidayEvents.map((e) => ({
    date: e.startDate.toISOString(),
    name: e.title,
  }));
}

/**
 * Check if a date falls on a holiday or weekend.
 */
export function isWorkingDay(date: Date, holidays: Array<{ date: string; name: string }>): boolean {
  // Weekend check (Saturday = 6, Sunday = 0)
  const day = date.getDay();
  if (day === 0 || day === 6) return false;
  // Holiday check
  const dateStr = date.toISOString().slice(0, 10);
  return !holidays.some((h) => h.date.slice(0, 10) === dateStr);
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapCalendar(c: any): AcademicCalendarDto {
  return {
    id: c.id,
    organizationId: c.organizationId,
    year: c.year,
    term: c.term,
    startDate: c.startDate.toISOString(),
    endDate: c.endDate.toISOString(),
    schedule: safeParseSchedule(c.schedule),
    status: c.status,
    events: (c.events ?? []).map(mapEvent),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

function mapEvent(e: any): CalendarEventDto {
  return {
    id: e.id,
    calendarId: e.calendarId,
    type: e.type,
    title: e.title,
    description: e.description,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate?.toISOString() ?? null,
    scopeType: e.scopeType,
    scopeId: e.scopeId,
    metadata: safeParseRecord(e.metadata),
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

function safeParseSchedule(raw: string | null): AcademicCalendarDto["schedule"] {
  if (!raw) return { holidays: [], gradingPeriods: [], examPeriods: [] };
  try {
    const parsed = JSON.parse(raw);
    return {
      holidays: parsed.holidays ?? [],
      gradingPeriods: parsed.gradingPeriods ?? [],
      examPeriods: parsed.examPeriods ?? [],
    };
  } catch {
    return { holidays: [], gradingPeriods: [], examPeriods: [] };
  }
}

function safeParseRecord(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}
