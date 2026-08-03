/** GET/POST /api/telemetry/traces — Distributed tracing */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listTraces, startTrace, startSpan, finishSpan, getTraceById, supportsAllSpanKinds, supportsAllSpanStatuses } from "@/features/telemetry-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const traceId = searchParams.get("traceId");
  if (traceId) return NextResponse.json({ trace: getTraceById(traceId) });
  const limit = Number(searchParams.get("limit") ?? 50);
  return NextResponse.json({
    traces: listTraces(limit),
    spanKinds: supportsAllSpanKinds(), spanStatuses: supportsAllSpanStatuses(),
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  if (body.action === "start_span") return NextResponse.json({ span: startSpan(body) });
  if (body.action === "finish_span") return NextResponse.json({ span: finishSpan(body.spanId, body.status) });
  const { trace, rootSpan } = startTrace(body);
  return NextResponse.json({ trace, rootSpan }, { status: 201 });
});
