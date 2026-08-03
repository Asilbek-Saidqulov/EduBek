/** GET /api/game-modes/empire/status — Empire Builder status (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getEmpireStatus } from "@/features/game-modes/empire-builder";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const result = typeof getEmpireStatus === 'function' ? getEmpireStatus() : getEmpireStatus;
  return NextResponse.json(result);
});
