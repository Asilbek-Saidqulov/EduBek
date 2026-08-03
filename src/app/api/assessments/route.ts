/**
 * POST /api/assessments  — create an assessment (draft)
 * GET  /api/assessments  — list assessments (paginated, filterable)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  createAssessment,
  listAssessments,
  createAssessmentBodySchema,
  listAssessmentsQuerySchema,
} from "@/features/assessment";

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const body = createAssessmentBodySchema.parse(await req.json());
  const assessment = await createAssessment(ctx, body);
  return NextResponse.json(assessment, { status: 201 });
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const url = new URL(req.url);
  const query = listAssessmentsQuerySchema.parse(Object.fromEntries(url.searchParams));
  const result = await listAssessments(ctx, query);
  return NextResponse.json(result);
});
