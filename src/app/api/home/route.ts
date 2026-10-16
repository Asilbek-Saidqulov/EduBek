import { NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ctx = await getAuthContext().catch(() => null);
    const userId = ctx?.userId ?? ctx?.user?.id ?? null;

    if (!userId) {
      return NextResponse.json({
        continueItem: null,
        todayPlan: [],
        weakTopics: [],
        streak: 0,
        level: 1,
      });
    }

    const [streak, lastSession, recentAttempts] = await Promise.all([
      prisma.userStreak.findUnique({ where: { userId } }).catch(() => null),
      prisma.learningSession
        .findFirst({
          where: { studentId: userId },
          orderBy: { updatedAt: "desc" },
          include: { resource: true },
        })
        .catch(() => null),
      prisma.quizAttempt
        .findMany({
          where: { userId },
          orderBy: { finishedAt: "desc" },
          take: 10,
          include: { quiz: true },
        })
        .catch(() => []),
    ]);

    const continueItem = lastSession
      ? {
          id: lastSession.id,
          title: lastSession.resource?.title || "Last lesson",
          subject: lastSession.resource?.subject || "Learning",
          done: lastSession.interactions || 1,
          total: 5,
        }
      : null;

    const weakTopics = recentAttempts
      .filter((a: any) => a.maxScore > 0 && a.score / a.maxScore < 0.6)
      .slice(0, 3)
      .map((a: any) => ({
        id: a.quizId,
        name: a.quiz?.title || "Quiz",
        errorRate: Math.round(100 - (a.score / a.maxScore) * 100),
      }));

    const todayPlan = continueItem
      ? [{ id: "continue", title: `Continue: ${continueItem.title}`, done: false }]
      : [];

    return NextResponse.json({
      continueItem,
      todayPlan,
      weakTopics,
      streak: streak?.currentStreak ?? 0,
      level: 1,
    });
  } catch (e) {
    console.error("[api/home]", e);
    return NextResponse.json({
      continueItem: null,
      todayPlan: [],
      weakTopics: [],
      streak: 0,
      level: 1,
    });
  }
}
