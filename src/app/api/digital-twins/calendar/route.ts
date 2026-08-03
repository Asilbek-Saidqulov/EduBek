/**
 * GET  /api/digital-twins/calendar — List calendars
 * POST /api/digital-twins/calendar — Create a calendar
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listCalendars, createCalendar } from "@/features/digital-twins";
import { z } from "zod";

const createSchema = z.object({
  organizationId: z.string().optional(),
  year: z.string().min(1).max(20),
  term: z.string().max(100).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  schedule: z.object({
    holidays: z.array(z.object({ date: z.string(), name: z.string() })).optional(),
    gradingPeriods: z.array(z.object({ start: z.string(), end: z.string(), name: z.string() })).optional(),
    examPeriods: z.array(z.object({ start: z.string(), end: z.string(), name: z.string() })).optional(),
  }).optional(),
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
  const calendars = await listCalendars({
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    year: url.searchParams.get("year") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 20),
  });
  return NextResponse.json({ calendars, total: calendars.length });
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
  const calendar = await createCalendar(body);
  return NextResponse.json(calendar, { status: 201 });
});
