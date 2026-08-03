/**
 * POST /api/ai-assessment/questions  — generate questions via AI (subscription-gated)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { z } from "zod";
import { generateQuestions } from "@/features/assessment";

const bodySchema = z.object({
  topic: z.string().min(1).max(500),
  subject: z.string().max(120).optional(),
  grade: z.string().max(120).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  questionType: z.string().max(50).optional(),
  count: z.number().int().min(1).max(20).optional(),
  language: z.string().max(10).optional(),
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const body = bodySchema.parse(await req.json());
  const result = await generateQuestions(ctx, body);
  return NextResponse.json(result);
});
