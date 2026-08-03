/** GET/POST /api/notifications/realtime — Real-time notification queue */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listRealtime, enqueueRealtime, dispatchRealtime, markRealtimeDelivered, markRealtimeFailed, dropRealtime, retryRealtime, collapseGroup, generateRealtimeStats, supportsAllRealtimeStatuses } from "@/features/notifications-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as any;
  return NextResponse.json({
    notifications: listRealtime(status ?? undefined, ctx.userId),
    stats: generateRealtimeStats(),
    statuses: supportsAllRealtimeStatuses(),
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  if (body.action === "dispatch") return NextResponse.json({ notification: dispatchRealtime(body.id) });
  if (body.action === "deliver") return NextResponse.json({ notification: markRealtimeDelivered(body.id) });
  if (body.action === "fail") return NextResponse.json({ notification: markRealtimeFailed(body.id, body.reason) });
  if (body.action === "drop") return NextResponse.json({ notification: dropRealtime(body.id) });
  if (body.action === "retry") return NextResponse.json({ notification: retryRealtime(body.id) });
  if (body.action === "collapse") return NextResponse.json({ collapsed: collapseGroup(body.groupKey) });
  const notification = enqueueRealtime(body);
  return NextResponse.json({ notification }, { status: 201 });
});
