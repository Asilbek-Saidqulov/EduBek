/** GET/POST /api/telemetry/queues — Queue monitoring */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listQueueMetrics, recordQueueMetric, getQueueSummary, supportsAllQueueTypes } from "@/features/telemetry-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const queueName = searchParams.get("queueName") ?? undefined;
  return NextResponse.json({
    queues: listQueueMetrics(queueName, 50), summary: getQueueSummary(), types: supportsAllQueueTypes(),
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  const m = recordQueueMetric(body);
  return NextResponse.json({ queue: m }, { status: 201 });
});
