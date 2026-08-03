/**
 * POST /api/plagiarism/flag  — manually flag a submission for plagiarism
 *   Body: { attemptId, reason }
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { z } from "zod";
import { flagSubmission } from "@/features/plagiarism";

const flagBodySchema = z.object({
  attemptId: z.string().min(1),
  reason: z.string().min(1).max(2_000),
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const body = flagBodySchema.parse(await req.json());
  const report = await flagSubmission(ctx, body.attemptId, body.reason);
  return NextResponse.json(report, { status: 201 });
});
