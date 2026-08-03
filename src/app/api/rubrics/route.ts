/**
 * POST /api/rubrics  — create a rubric
 * GET  /api/rubrics  — list my rubrics
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  createRubric,
  listMyRubrics,
  createRubricBodySchema,
} from "@/features/rubric";

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const body = createRubricBodySchema.parse(await req.json());
  const rubric = await createRubric(ctx, body);
  return NextResponse.json(rubric, { status: 201 });
});

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  const rubrics = await listMyRubrics(ctx);
  return NextResponse.json({ rubrics });
});
