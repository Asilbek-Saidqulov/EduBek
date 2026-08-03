/**
 * POST /api/ai-assessment/rubric  — generate a rubric via AI
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { z } from "zod";
import { generateRubric } from "@/features/assessment";

const bodySchema = z.object({
  topic: z.string().min(1).max(500),
  subject: z.string().max(120).optional(),
  grade: z.string().max(120).optional(),
  maxPoints: z.number().int().min(1).max(1_000).optional(),
  language: z.string().max(10).optional(),
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const body = bodySchema.parse(await req.json());
  const result = await generateRubric(ctx, body);
  return NextResponse.json(result);
});
