/** GET /api/progression/profile — Player profile (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getProfile } from "@/features/player-progression";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") ?? ctx.userId;
  const profile = getProfile(userId);
  if (!profile) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Profile not found" } }, { status: 404 });
  }
  return NextResponse.json(profile);
});
