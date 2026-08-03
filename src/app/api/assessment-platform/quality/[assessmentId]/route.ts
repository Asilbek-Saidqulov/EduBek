/** GET /api/assessment-platform/quality/:assessmentId — Get or compute assessment quality */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getAssessmentQuality, analyzeAssessmentQuality } from "@/features/assessment-platform";

export const GET = withErrorHandler<{ assessmentId: string }>(async (req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const { assessmentId } = await ctx.params;
  const url = new URL(req.url);
  const refresh = url.searchParams.get("refresh") === "true";
  const quality = refresh
    ? await analyzeAssessmentQuality(assessmentId)
    : await getAssessmentQuality(assessmentId);
  return NextResponse.json(quality);
});
