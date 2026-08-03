/** GET+POST /api/civilization/decisions — List/analyze decisions */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listDecisions, analyzeDecision, updateDecisionStatus } from "@/features/civilization-engine";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const decisions = await listDecisions({ organizationId: url.searchParams.get("organizationId")!, type: url.searchParams.get("type") ?? undefined, status: url.searchParams.get("status") ?? undefined, limit: Number(url.searchParams.get("limit") ?? 50) });
  return NextResponse.json({ decisions, total: decisions.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  if (url.searchParams.get("action") === "update_status") {
    const body = await req.json();
    const decision = await updateDecisionStatus(body.id, body.status, body.actualOutcome);
    return NextResponse.json(decision);
  }
  const body = await req.json();
  const decision = await analyzeDecision(body);
  return NextResponse.json(decision, { status: 201 });
});
