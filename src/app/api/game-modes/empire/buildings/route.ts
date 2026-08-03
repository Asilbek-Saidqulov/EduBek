/** GET /api/game-modes/empire/buildings — Empire Builder buildings (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { BUILDING_DEFS } from "@/features/game-modes/empire-builder";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const result = typeof BUILDING_DEFS === 'function' ? BUILDING_DEFS() : BUILDING_DEFS;
  return NextResponse.json(result);
});
