/**
 * GET /api/live/players/mine/history  — get the caller's session history
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getMyHistory } from "@/features/player";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  const history = await getMyHistory(ctx);
  return NextResponse.json(history);
});
