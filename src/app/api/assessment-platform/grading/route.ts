/** POST /api/assessment-platform/grading — AI grade a response */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { aiGrade } from "@/features/assessment-platform";
import { z } from "zod";

const schema = z.object({
  assessmentId: z.string().min(1),
  attemptId: z.string().min(1),
  studentId: z.string().min(1),
  responseText: z.string(),
  rubricId: z.string().optional(),
  questionType: z.string().default("essay"),
  correctAnswer: z.string().optional(),
  maxScore: z.number().int().min(1).max(1000).default(100),
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = schema.parse(await req.json());
  const result = await aiGrade(body);
  return NextResponse.json(result, { status: 201 });
});
