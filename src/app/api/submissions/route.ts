/**
 * GET /api/submissions       — list submissions
 * GET /api/submissions/[id]  — get a single submission
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  getSubmission,
  listSubmissions,
  listSubmissionsQuerySchema,
} from "@/features/submission";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const url = new URL(req.url);
  const query = listSubmissionsQuerySchema.parse(
    Object.fromEntries(url.searchParams.entries()),
  );
  const submissions = await listSubmissions(ctx, query);
  return NextResponse.json({ submissions });
});
