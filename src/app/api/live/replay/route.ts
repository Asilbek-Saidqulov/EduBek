/**
 * GET /api/live/replay  — list replays (admin scope)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listReplays, listReplaysQuerySchema } from "@/features/replay";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const url = new URL(req.url);
  const query = listReplaysQuerySchema.parse(Object.fromEntries(url.searchParams));
  const result = await listReplays(ctx, query);
  return NextResponse.json(result);
});
