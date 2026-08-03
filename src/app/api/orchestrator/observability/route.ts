/**
 * GET /api/orchestrator/observability — Observability snapshot (traces, latency, errors).
 *
 * Query params:
 *   - traceId (string — get a specific trace)
 *   - recent (boolean — list recent traces)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  getObservabilitySnapshot, getTrace, listRecentTraces,
} from "@/features/platform-orchestrator";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const url = new URL(req.url);
  const traceId = url.searchParams.get("traceId");
  const recent = url.searchParams.get("recent") === "true";

  if (traceId) {
    const trace = await getTrace(traceId);
    if (!trace) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Trace not found" } }, { status: 404 });
    }
    return NextResponse.json(trace);
  }

  if (recent) {
    const traces = await listRecentTraces(20);
    return NextResponse.json({ traces });
  }

  const snapshot = await getObservabilitySnapshot();
  return NextResponse.json(snapshot);
});
