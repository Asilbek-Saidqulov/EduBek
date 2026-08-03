/** GET /api/discovery/weak-topics — Knowledge gap report (weak topics + missing prerequisites + forgotten) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { buildKnowledgeGapReport } from "@/features/semantic-search/knowledge-gap";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }

  const report = await buildKnowledgeGapReport(ctx.userId);

  return NextResponse.json({
    weakTopics: report.weakTopics,
    missingPrerequisites: report.missingPrerequisites,
    forgottenTopics: report.forgottenTopics,
    learningProgress: report.learningProgress,
    readinessScore: report.readinessScore,
    total: report.weakTopics.length,
  });
});
