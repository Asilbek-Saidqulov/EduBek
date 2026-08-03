/**
 * GET /api/proctoring/mine  — list the caller's proctoring incidents
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getMyIncidents } from "@/features/proctoring";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  const incidents = await getMyIncidents(ctx);
  return NextResponse.json({ incidents });
});
