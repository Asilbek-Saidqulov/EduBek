/**
 * POST /api/intelligence/ask — AI Curriculum Assistant
 *
 * Body: { question, scopeType, scopeId, frameworkId?, locale? }
 *
 * Returns a structured answer with evidence + follow-up suggestions.
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { answerCurriculumQuestion } from "@/features/knowledge-intelligence";
import { z } from "zod";

const schema = z.object({
  question: z.string().min(1).max(500),
  scopeType: z.enum(["classroom", "organization", "framework"]),
  scopeId: z.string().min(1),
  frameworkId: z.string().optional(),
  locale: z.string().min(2).max(5).optional(),
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const body = schema.parse(await req.json());
  const answer = await answerCurriculumQuestion({
    ...body,
    locale: body.locale ?? ctx.locale ?? "en",
  });
  return NextResponse.json(answer);
});
