/** GET/POST /api/telemetry/metrics — Metrics platform */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listMetrics, defineMetric, recordMetric, getMetricAggregateForKey, supportsAllMetricTypes } from "@/features/telemetry-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as any;
  const active = searchParams.get("active");
  return NextResponse.json({
    metrics: listMetrics(type ?? undefined, active === null ? undefined : active === "true"),
    types: supportsAllMetricTypes(),
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  if (body.action === "record") {
    const sample = recordMetric(body);
    return NextResponse.json({ sample, aggregate: getMetricAggregateForKey(body.metricKey) });
  }
  const metric = defineMetric(body);
  return NextResponse.json({ metric }, { status: 201 });
});
