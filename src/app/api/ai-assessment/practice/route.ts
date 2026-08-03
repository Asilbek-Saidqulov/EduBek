/**
 * POST /api/ai-assessment/practice  — generate a practice quiz for weak topics
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { z } from "zod";
import { generatePracticeQuiz } from "@/features/assessment";

const bodySchema = z.object({
  topic: z.string().min(1).max(500),
  weakAreas: z.array(z.string().max(200)).max(10).optional(),
  questionCount: z.number().int().min(1).max(20).optional(),
  language: z.string().max(10).optional(),
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const body = bodySchema.parse(await req.json());
  const result = await generatePracticeQuiz(ctx, body);
  return NextResponse.json(result);
});
