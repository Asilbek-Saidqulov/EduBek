/**
 * POST /api/plagiarism/compare  — compare a source response against other responses
 *   Body: { attemptId, sourceResponseId, comparedWithResponseIds: string[], threshold?: number, providerName?: string }
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { z } from "zod";
import { compareSubmissions } from "@/features/plagiarism";

const compareBodySchema = z.object({
  attemptId: z.string().min(1),
  sourceResponseId: z.string().min(1),
  comparedWithResponseIds: z.array(z.string().min(1)).min(1).max(50),
  threshold: z.number().min(0).max(100).optional(),
  providerName: z.string().optional(),
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const body = compareBodySchema.parse(await req.json());
  const report = await compareSubmissions(ctx, body);
  return NextResponse.json(report, { status: 201 });
});
