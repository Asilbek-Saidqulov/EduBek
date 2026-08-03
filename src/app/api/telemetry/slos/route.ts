/** GET/POST /api/telemetry/slos — SLO platform */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listSLOs, createSLO, updateSLOStatus, listSLOStatuses, getSLOSummary, supportsAllSLOTypes } from "@/features/telemetry-platform";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  return NextResponse.json({
    slos: listSLOs(), statuses: listSLOStatuses(), summary: getSLOSummary(), types: supportsAllSLOTypes(),
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  if (body.action === "update_status") return NextResponse.json({ status: updateSLOStatus(body.sloId, body.current) });
  const slo = createSLO(body);
  return NextResponse.json({ slo }, { status: 201 });
});
