/** GET+POST /api/cloud/costs — List/record cost snapshots */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listCostSnapshots, recordCostSnapshot } from "@/features/cloud-infra";
import { z } from "zod";

const schema = z.object({
  organizationId: z.string().optional(),
  breakdown: z.record(z.string(), z.number()).optional(),
  totalCredits: z.number().int().min(0).default(0),
  estimatedUsd: z.number().min(0).default(0),
  byService: z.array(z.object({ service: z.string(), credits: z.number(), usd: z.number() })).optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const snapshots = await listCostSnapshots({
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 30),
  });
  return NextResponse.json({ snapshots, total: snapshots.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = schema.parse(await req.json());
  const snapshot = await recordCostSnapshot(body);
  return NextResponse.json(snapshot, { status: 201 });
});
