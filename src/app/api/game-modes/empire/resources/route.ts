/** GET /api/game-modes/empire/resources — Empire Builder resources (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { RESOURCE_CONFIGS } from "@/features/game-modes/empire-builder";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const result = typeof RESOURCE_CONFIGS === 'function' ? RESOURCE_CONFIGS() : RESOURCE_CONFIGS;
  return NextResponse.json(result);
});
