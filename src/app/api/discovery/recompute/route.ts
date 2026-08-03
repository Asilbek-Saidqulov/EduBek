/** POST /api/discovery/recompute — Recompute user's interest profile */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { recomputeInterestProfile } from "@/features/semantic-search";

export const POST = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }

  const profile = await recomputeInterestProfile(ctx.userId);
  return NextResponse.json(profile);
});
