/** GET/POST /api/telemetry/heartbeats — Heartbeat platform */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { sendHeartbeat, getHeartbeatStatsForService, listHeartbeats } from "@/features/telemetry-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const serviceId = searchParams.get("serviceId") ?? undefined;
  const stats = serviceId ? getHeartbeatStatsForService(serviceId) : null;
  return NextResponse.json({ heartbeats: listHeartbeats(serviceId, 50), stats });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  const hb = sendHeartbeat(body);
  return NextResponse.json({ heartbeat: hb }, { status: 201 });
});
