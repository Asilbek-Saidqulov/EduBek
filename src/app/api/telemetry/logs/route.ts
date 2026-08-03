/** GET/POST /api/telemetry/logs — Structured logging */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listLogs, log, supportsAllLogLevels } from "@/features/telemetry-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const level = searchParams.get("level") as any;
  const serviceId = searchParams.get("serviceId") ?? undefined;
  const limit = Number(searchParams.get("limit") ?? 100);
  return NextResponse.json({ logs: listLogs(level ?? undefined, serviceId, limit), levels: supportsAllLogLevels() });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  const entry = log(body);
  return NextResponse.json({ entry }, { status: 201 });
});
