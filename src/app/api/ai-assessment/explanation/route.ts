/**
 * POST /api/ai-assessment/explanation  — generate an explanation for an incorrect answer
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { z } from "zod";
import { generateExplanation } from "@/features/assessment";

const bodySchema = z.object({
  questionPrompt: z.string().min(1).max(5_000),
  questionType: z.string().min(1).max(50),
  correctAnswer: z.string().min(1).max(5_000),
  studentAnswer: z.string().max(5_000).optional(),
  language: z.string().max(10).optional(),
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const body = bodySchema.parse(await req.json());
  const result = await generateExplanation(ctx, body);
  return NextResponse.json(result);
});
