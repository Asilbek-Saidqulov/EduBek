/** GET+POST /api/cloud/metrics — List/record infra metrics */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listMetrics, recordMetric } from "@/features/cloud-infra";
import { z } from "zod";

const schema = z.object({
  source: z.string().min(1), metric: z.string().min(1), value: z.number(),
  unit: z.string().default("count"), labels: z.record(z.string(), z.unknown()).optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const metrics = await listMetrics({
    source: url.searchParams.get("source") ?? undefined,
    metric: url.searchParams.get("metric") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 500),
  });
  return NextResponse.json({ metrics, total: metrics.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = schema.parse(await req.json());
  const metric = await recordMetric(body);
  return NextResponse.json(metric, { status: 201 });
});
