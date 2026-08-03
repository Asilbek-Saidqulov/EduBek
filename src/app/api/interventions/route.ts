/**
 * GET  /api/interventions — List interventions (for the current teacher)
 * POST /api/interventions — Create an intervention manually
 * PATCH /api/interventions/:id — Update intervention status
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { createIntervention, listInterventions } from "@/features/collaboration";
import { z } from "zod";

const postSchema = z.object({
  classroomId: z.string().optional(),
  studentIds: z.array(z.string()).default([]),
  reason: z.string().min(1).max(200),
  reasonKey: z.string().optional(),
  description: z.string().min(1).max(2000),
  actionPlan: z.record(z.string(), z.unknown()).optional(),
  confidence: z.number().min(0).max(1).default(0.5),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const url = new URL(req.url);
  const interventions = await listInterventions({
    teacherId: ctx.userId,
    classroomId: url.searchParams.get("classroomId") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json({ interventions, total: interventions.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const body = postSchema.parse(await req.json());
  const intervention = await createIntervention({
    teacherId: ctx.userId,
    ...body,
  });
  return NextResponse.json(intervention, { status: 201 });
});
