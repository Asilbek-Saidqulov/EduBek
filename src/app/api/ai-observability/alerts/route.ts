/**
 * GET /api/ai-observability/alerts — List AI alerts (read-only)
 * POST /api/ai-observability/alerts — Generate/acknowledge/resolve alerts
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { generateAlerts, acknowledgeAlert, resolveAlert } from "@/features/ai-observability";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const report = await generateAlerts();
  return NextResponse.json(report);
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { action, alertId } = body as Record<string, unknown>;
  if (action === "acknowledge" && alertId) {
    await acknowledgeAlert(String(alertId));
    return NextResponse.json({ ok: true });
  }
  if (action === "resolve" && alertId) {
    await resolveAlert(String(alertId));
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "action (acknowledge|resolve) and alertId are required" } }, { status: 400 });
});
