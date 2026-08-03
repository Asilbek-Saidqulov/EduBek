/**
 * GET  /api/digital-twins/calendar/events — List calendar events
 * POST /api/digital-twins/calendar/events — Add a calendar event
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listCalendarEvents, addCalendarEvent } from "@/features/digital-twins";
import { z } from "zod";

const createSchema = z.object({
  calendarId: z.string().min(1),
  type: z.enum(["holiday", "exam", "grading_period", "curriculum_deadline", "school_event", "teacher_event"]),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  scopeType: z.string().optional(),
  scopeId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const url = new URL(req.url);
  const events = await listCalendarEvents({
    calendarId: url.searchParams.get("calendarId") ?? undefined,
    type: url.searchParams.get("type") as any ?? undefined,
    scopeType: url.searchParams.get("scopeType") ?? undefined,
    scopeId: url.searchParams.get("scopeId") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 100),
  });
  return NextResponse.json({ events, total: events.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const body = createSchema.parse(await req.json());
  const event = await addCalendarEvent(body);
  return NextResponse.json(event, { status: 201 });
});
