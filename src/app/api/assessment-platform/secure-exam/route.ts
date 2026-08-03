/** POST /api/assessment-platform/secure-exam — Start / pause / resume / submit / autosave */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { startSecureExam, pauseSecureExam, resumeSecureExam, submitSecureExam, autosaveSecureExam, getSecureExamSession } from "@/features/assessment-platform";
import { z } from "zod";

const schema = z.object({
  action: z.enum(["start", "pause", "resume", "submit", "autosave", "get"]),
  assessmentId: z.string().min(1),
  durationMs: z.number().int().min(60_000).optional(),
  lockdown: z.boolean().optional(),
  randomizeQuestions: z.boolean().optional(),
  questionIds: z.array(z.string()).optional(),
  autosaveData: z.record(z.string(), z.unknown()).optional(),
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = schema.parse(await req.json());

  switch (body.action) {
    case "start":
      return NextResponse.json(await startSecureExam({
        assessmentId: body.assessmentId, userId: ctx.userId,
        durationMs: body.durationMs ?? 3600_000, lockdown: body.lockdown,
        randomizeQuestions: body.randomizeQuestions, questionIds: body.questionIds,
      }), { status: 201 });
    case "pause":
      return NextResponse.json(await pauseSecureExam(body.assessmentId, ctx.userId));
    case "resume":
      return NextResponse.json(await resumeSecureExam(body.assessmentId, ctx.userId));
    case "submit":
      return NextResponse.json(await submitSecureExam(body.assessmentId, ctx.userId));
    case "autosave":
      await autosaveSecureExam(body.assessmentId, ctx.userId, body.autosaveData ?? {});
      return NextResponse.json({ success: true });
    case "get":
      return NextResponse.json(await getSecureExamSession(body.assessmentId, ctx.userId));
  }
});
