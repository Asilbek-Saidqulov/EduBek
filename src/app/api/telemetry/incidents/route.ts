/** GET/POST /api/telemetry/incidents — Incidents */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listIncidents, openIncident, transitionIncident, supportsAllIncidentSeverities, supportsAllIncidentStatuses } from "@/features/telemetry-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as any;
  const severity = searchParams.get("severity") as any;
  return NextResponse.json({
    incidents: listIncidents(status ?? undefined, severity ?? undefined),
    severities: supportsAllIncidentSeverities(), statuses: supportsAllIncidentStatuses(),
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  const incident = openIncident(body);
  return NextResponse.json({ incident }, { status: 201 });
});

export const PUT = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  return NextResponse.json({ incident: transitionIncident(body.id, body.to, ctx.userId, body.description) });
});
