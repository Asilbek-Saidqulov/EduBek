import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth";
import { USAGE_POLICIES, peekPolicy } from "@/lib/usage-policy";
import { getActivePlan, PAYMENTS_ENABLED } from "@/lib/plans";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext().catch(() => null);
  const userId = ctx?.userId || null;

  const snapshot = {
    tutorHour: peekPolicy("tutorHour", req, userId),
    tutorDay: peekPolicy("tutorDay", req, userId),
    generateQuizHour: peekPolicy("generateQuizHour", req, userId),
    generateQuizDay: peekPolicy("generateQuizDay", req, userId),
    classroomJoinHour: peekPolicy("classroomJoinHour", req, userId),
  };

  const plan = getActivePlan();
  return NextResponse.json({
    subject: userId ? "signed-in" : "guest",
    planId: plan.id,
    paymentsEnabled: PAYMENTS_ENABLED,
    unlimited: ["published quizzes", "marketplace browse", "class list"],
    quotas: {
      tutorHour: {
        limit: plan.tutorHour,
        remaining: snapshot.tutorHour.remaining,
        resetAt: snapshot.tutorHour.resetAt.toISOString(),
      },
      tutorDay: {
        limit: plan.tutorDay,
        remaining: snapshot.tutorDay.remaining,
        resetAt: snapshot.tutorDay.resetAt.toISOString(),
      },
      generateQuizHour: {
        limit: plan.generateQuizHour,
        remaining: snapshot.generateQuizHour.remaining,
        resetAt: snapshot.generateQuizHour.resetAt.toISOString(),
      },
      generateQuizDay: {
        limit: plan.generateQuizDay,
        remaining: snapshot.generateQuizDay.remaining,
        resetAt: snapshot.generateQuizDay.resetAt.toISOString(),
      },
      classroomJoinHour: {
        limit: USAGE_POLICIES.classroomJoinHour.limit,
        remaining: snapshot.classroomJoinHour.remaining,
        resetAt: snapshot.classroomJoinHour.resetAt.toISOString(),
      },
    },
    note: "Practice quizzes stay unlimited. AI has an hourly burst cap and a daily plan cap.",
  });
}
