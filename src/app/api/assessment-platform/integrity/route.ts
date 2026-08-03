/**
 * GET  /api/assessment-platform/integrity — List integrity checks
 * POST /api/assessment-platform/integrity — Run an integrity check
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listIntegrityChecks, runIntegrityCheck } from "@/features/assessment-platform";
import { z } from "zod";

const schema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  userId: z.string().min(1),
  checkType: z.enum(["plagiarism", "ai_generated", "duplicate_submission", "collusion", "unusual_behavior", "answer_similarity", "identity_anomaly"]),
  content: z.string(),
  previousSubmissions: z.array(z.string()).optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const checks = await listIntegrityChecks({
    entityType: url.searchParams.get("entityType") ?? undefined,
    entityId: url.searchParams.get("entityId") ?? undefined,
    userId: url.searchParams.get("userId") ?? undefined,
    checkType: url.searchParams.get("checkType") ?? undefined,
    riskLevel: url.searchParams.get("riskLevel") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 100),
  });
  return NextResponse.json({ checks, total: checks.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = schema.parse(await req.json());
  const result = await runIntegrityCheck(body);
  return NextResponse.json(result, { status: 201 });
});
