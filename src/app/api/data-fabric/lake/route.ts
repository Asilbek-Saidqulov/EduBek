/**
 * GET  /api/data-fabric/lake — List intelligence lake snapshots
 * POST /api/data-fabric/lake — Capture a new snapshot
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listIntelligenceSnapshots, captureIntelligenceSnapshot } from "@/features/data-fabric";
import { z } from "zod";

const schema = z.object({
  type: z.enum(["forecasting", "trend_analysis", "curriculum_evolution", "ai_optimization", "org_planning", "longitudinal_research"]),
  organizationId: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const snapshots = await listIntelligenceSnapshots({
    type: url.searchParams.get("type") ?? undefined,
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 100),
  });
  return NextResponse.json({ snapshots, total: snapshots.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = schema.parse(await req.json());
  const snapshot = await captureIntelligenceSnapshot(body);
  return NextResponse.json(snapshot, { status: 201 });
});
