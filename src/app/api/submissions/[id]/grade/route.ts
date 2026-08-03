/**
 * POST /api/submissions/[id]/grade  — grade a submission (teacher only)
 *
 * Body: { points, maxPoints, feedback?, rubric? }
 */
import { NextResponse } from "next/server";
import { withErrorHandler, badRequest } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { gradeSubmission } from "@/features/grading";

const gradeBodySchema = (raw: unknown) => {
  const v = raw as Record<string, unknown>;
  if (v === null || typeof v !== "object") {
    throw badRequest("Body must be a JSON object");
  }
  const points = Number(v.points);
  const maxPoints = Number(v.maxPoints);
  if (!Number.isFinite(points)) throw badRequest("points must be a number");
  if (!Number.isFinite(maxPoints)) throw badRequest("maxPoints must be a number");
  const feedback =
    typeof v.feedback === "string" ? v.feedback : undefined;
  const rubric = v.rubric ?? undefined;
  return { points, maxPoints, feedback, rubric };
};

export const POST = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const { id } = (await ctx.params) as { id: string };
  const auth = await getAuthContext();
  const body = gradeBodySchema(await req.json().catch(() => ({})));
  const grade = await gradeSubmission(
    auth,
    id,
    body.points,
    body.maxPoints,
    body.feedback,
    body.rubric,
  );
  return NextResponse.json(grade);
});
