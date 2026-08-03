/** GET /api/game-modes/empire/events — Empire Builder events (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { EMPIRE_EVENTS } from "@/features/game-modes/empire-builder";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const result = typeof EMPIRE_EVENTS === 'function' ? EMPIRE_EVENTS() : EMPIRE_EVENTS;
  return NextResponse.json(result);
});
