/**
 * POST /api/ai-assessment/assessment  — generate an assessment outline via AI
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { z } from "zod";
import { generateAssessment } from "@/features/assessment";

const bodySchema = z.object({
  topic: z.string().min(1).max(500),
  subject: z.string().max(120).optional(),
  grade: z.string().max(120).optional(),
  assessmentType: z.enum(["quiz", "exam", "practice"]).optional(),
  questionCount: z.number().int().min(1).max(50).optional(),
  durationMinutes: z.number().int().min(1).max(480).optional(),
  language: z.string().max(10).optional(),
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const body = bodySchema.parse(await req.json());
  const result = await generateAssessment(ctx, body);
  return NextResponse.json(result);
});
