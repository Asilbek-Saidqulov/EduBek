/**
 * GET  /api/assessment-platform/blueprints — List blueprints
 * POST /api/assessment-platform/blueprints — Build a new assessment blueprint
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listBlueprints, buildAssessment } from "@/features/assessment-platform";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1).max(300),
  assessmentType: z.enum(["quiz", "exam", "assignment", "essay", "oral_exam", "practical", "project", "peer_review", "lab_work", "presentation", "coding", "competency"]),
  subject: z.string().optional(),
  classroomId: z.string().optional(),
  frameworkId: z.string().optional(),
  targetDifficulty: z.enum(["easy", "medium", "hard", "expert"]).default("medium"),
  questionCount: z.number().int().min(1).max(100).default(10),
  locale: z.string().optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const blueprints = await listBlueprints({
    createdBy: url.searchParams.get("createdBy") ?? undefined,
    assessmentType: url.searchParams.get("assessmentType") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json({ blueprints, total: blueprints.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = schema.parse(await req.json());
  const blueprint = await buildAssessment({ ...body, createdBy: ctx.userId });
  return NextResponse.json(blueprint, { status: 201 });
});
