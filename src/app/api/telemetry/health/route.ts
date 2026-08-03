/** GET/POST /api/telemetry/health — Health monitoring */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listHealthChecks, recordHealthCheck, getPlatformHealth, supportsAllHealthStatuses } from "@/features/telemetry-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const serviceId = searchParams.get("serviceId") ?? undefined;
  return NextResponse.json({
    checks: listHealthChecks(serviceId, 100),
    platform: getPlatformHealth(),
    statuses: supportsAllHealthStatuses(),
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  const check = recordHealthCheck(body);
  return NextResponse.json({ check }, { status: 201 });
});
