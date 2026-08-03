/**
 * GET /api/live/lobbies  — list open public lobbies
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listPublicLobbies, listLobbiesQuerySchema } from "@/features/lobby";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const url = new URL(req.url);
  const query = listLobbiesQuerySchema.parse(Object.fromEntries(url.searchParams));
  const result = await listPublicLobbies(ctx, query);
  return NextResponse.json(result);
});
