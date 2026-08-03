/** GET/POST /api/telemetry/alerts — Alert platform */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listAlerts, triggerAlert, acknowledgeAlert, resolveAlert, createAlertRule, listAlertRules, supportsAllAlertSeverities, supportsAllAlertStatuses, supportsAllAlertConditions } from "@/features/telemetry-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as any;
  const severity = searchParams.get("severity") as any;
  return NextResponse.json({
    alerts: listAlerts(status ?? undefined, severity ?? undefined),
    rules: listAlertRules(),
    severities: supportsAllAlertSeverities(), statuses: supportsAllAlertStatuses(), conditions: supportsAllAlertConditions(),
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  if (body.action === "acknowledge") return NextResponse.json({ alert: acknowledgeAlert(body.id, ctx.userId) });
  if (body.action === "resolve") return NextResponse.json({ alert: resolveAlert(body.id) });
  if (body.action === "create_rule") return NextResponse.json({ rule: createAlertRule(body) });
  const alert = triggerAlert(body);
  return NextResponse.json({ alert }, { status: 201 });
});
