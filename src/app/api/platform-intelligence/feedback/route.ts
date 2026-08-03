/** POST /api/platform-intelligence/feedback — Record a feedback event */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { recordFeedbackEvent } from "@/features/platform-intelligence";
import { z } from "zod";

const schema = z.object({
  type: z.enum([
    "quiz_completed", "lesson_opened", "resource_abandoned",
    "recommendation_clicked", "recommendation_ignored", "recommendation_dismissed",
    "search_success", "search_failure",
    "ai_generation_accepted", "ai_generation_regenerated",
    "marketplace_purchase", "marketplace_refund",
    "course_completed", "certificate_earned",
    "discussion_solved", "teacher_edited_ai_output", "student_corrected_answer",
  ]),
  scopeType: z.string().optional(),
  scopeId: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
  outcome: z.enum(["positive", "negative", "neutral"]).optional(),
  value: z.number().min(0).max(1).optional(),
  experimentId: z.string().optional(),
  variant: z.string().optional(),
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const body = schema.parse(await req.json());
  // Anonymous feedback allowed (userId optional) — attach when available
  const event = await recordFeedbackEvent({
    ...body,
    userId: ctx.userId,
  });
  return NextResponse.json(event, { status: 201 });
});
