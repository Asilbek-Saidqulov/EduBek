/**
 * GET  /api/data-fabric/traces — List observability traces
 * POST /api/data-fabric/traces — Record a trace
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listTraces, recordTrace } from "@/features/data-fabric";
import { z } from "zod";

const schema = z.object({
  traceType: z.string().min(1), correlationId: z.string().min(1), operation: z.string().min(1),
  organizationId: z.string().optional(), status: z.enum(["success", "error", "timeout"]).default("success"),
  durationMs: z.number().int().min(0).default(0),
  spans: z.array(z.record(z.string(), z.unknown())).optional(),
  metrics: z.record(z.string(), z.unknown()).optional(),
  logs: z.array(z.record(z.string(), z.unknown())).optional(),
  dependencies: z.array(z.record(z.string(), z.unknown())).optional(),
  errorMessage: z.string().optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const traces = await listTraces({
    traceType: url.searchParams.get("traceType") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    correlationId: url.searchParams.get("correlationId") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 100),
  });
  return NextResponse.json({ traces, total: traces.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = schema.parse(await req.json());
  const trace = await recordTrace(body as any);
  return NextResponse.json(trace, { status: 201 });
});
