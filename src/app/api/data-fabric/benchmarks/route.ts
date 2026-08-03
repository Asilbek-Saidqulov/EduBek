/**
 * GET  /api/data-fabric/benchmarks — List benchmark reports
 * POST /api/data-fabric/benchmarks — Generate a benchmark report
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listBenchmarks, generateBenchmarkReport } from "@/features/data-fabric";
import { z } from "zod";

const schema = z.object({ organizationId: z.string().min(1), period: z.enum(["monthly", "quarterly", "annual"]).default("monthly") });

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const reports = await listBenchmarks({
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    period: url.searchParams.get("period") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json({ reports, total: reports.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = schema.parse(await req.json());
  const report = await generateBenchmarkReport(body);
  return NextResponse.json(report, { status: 201 });
});
