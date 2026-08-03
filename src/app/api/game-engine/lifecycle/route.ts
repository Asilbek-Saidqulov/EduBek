/** GET /api/game-engine/lifecycle — Lifecycle state machine info (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getValidTransitions, VALID_TRANSITIONS } from "@/features/game-engine";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const url = new URL(req.url);
  const state = url.searchParams.get("state") as keyof typeof VALID_TRANSITIONS | null;
  if (state) {
    return NextResponse.json({ state, validTransitions: getValidTransitions(state) });
  }
  return NextResponse.json({ states: Object.keys(VALID_TRANSITIONS), transitions: VALID_TRANSITIONS });
});
