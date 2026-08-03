/**
 * GET /api/proctoring/incidents  — list proctoring incidents (teacher scope)
 *
 * Query: ?attemptId=...&studentId=...&severity=...&incidentType=...
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  listIncidents,
  listIncidentsQuerySchema,
} from "@/features/proctoring";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const url = new URL(req.url);
  const query = listIncidentsQuerySchema.parse(Object.fromEntries(url.searchParams));
  const result = await listIncidents(ctx, query);
  return NextResponse.json(result);
});
