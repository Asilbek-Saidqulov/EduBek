import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { withErrorHandler, forbidden, notFound, type RouteContext } from "@/lib/errors";

function parseOptions(optionsRaw: string | null): string[] {
  if (!optionsRaw) return [];
  try {
    const parsed = JSON.parse(optionsRaw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

/** Practice payload for a published quiz. Includes the answer so the arena can grade locally. */
export const GET = withErrorHandler<{ id: string }>(
  async (_req: NextRequest, ctx: RouteContext<{ id: string }>) => {
    const { id } = await ctx.params;
    const quiz = await db.quiz.findUnique({
      where: { id },
      include: { questions: { orderBy: { orderNum: "asc" } } },
    });
    if (!quiz) throw notFound("Quiz not found");
    if (!quiz.isPublished) throw forbidden("This quiz is not published");

    return NextResponse.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        category: quiz.category,
        questions: quiz.questions.map((q) => ({
          id: q.id,
          question: q.question,
          options: parseOptions(q.options),
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          points: q.points ?? 1,
          topic: quiz.category,
        })),
      },
    });
  },
);
