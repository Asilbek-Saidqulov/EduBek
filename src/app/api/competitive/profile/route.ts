/** GET /api/competitive/profile — Competitive platform profile (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getCompetitiveProfile } from "@/features/competitive-platform";
import { resolveTargetUserId } from "@/lib/auth/resolve-target-user";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const userId = resolveTargetUserId(ctx, searchParams.get("userId"));
  const profile = getCompetitiveProfile(userId); if (!profile) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Competitive profile not found' } }, { status: 404 }); return NextResponse.json(profile);
});
