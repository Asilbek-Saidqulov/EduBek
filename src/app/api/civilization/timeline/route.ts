/** GET+POST /api/civilization/timeline — List/record timeline events */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listTimelineEvents, recordTimelineEvent, replayTimeline } from "@/features/civilization-engine";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const orgId = url.searchParams.get("organizationId") ?? undefined;
  if (url.searchParams.get("action") === "replay") {
    const events = await replayTimeline(orgId!, url.searchParams.get("from") ? new Date(url.searchParams.get("from")!) : undefined, url.searchParams.get("to") ? new Date(url.searchParams.get("to")!) : undefined);
    return NextResponse.json({ events, total: events.length });
  }
  const events = await listTimelineEvents({ organizationId: orgId, type: url.searchParams.get("type") ?? undefined, severity: url.searchParams.get("severity") ?? undefined, limit: Number(url.searchParams.get("limit") ?? 200) });
  return NextResponse.json({ events, total: events.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = await req.json();
  const event = await recordTimelineEvent(body);
  return NextResponse.json(event, { status: 201 });
});
