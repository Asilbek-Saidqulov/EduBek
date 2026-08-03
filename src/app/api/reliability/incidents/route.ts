/**
 * GET /api/reliability/incidents — List recent incidents (read-only)
 * POST /api/reliability/incidents — Generate an incident report
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { generateIncidentReport, listRecentIncidents } from "@/features/production/reliability";
import type { IncidentSeverity } from "@/features/production/reliability";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const incidents = await listRecentIncidents();
  return NextResponse.json({ incidents });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const incident = await generateIncidentReport({
    title: body.title ? String(body.title) : undefined,
    description: body.description ? String(body.description) : undefined,
    affectedSystems: Array.isArray(body.affectedSystems) ? body.affectedSystems as string[] : undefined,
    severity: body.severity as IncidentSeverity | undefined,
  });
  return NextResponse.json(incident, { status: 201 });
});
