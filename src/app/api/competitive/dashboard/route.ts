/** GET /api/competitive/dashboard — Competitive platform dashboard (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { generateCompetitiveDashboard } from "@/features/competitive-platform";
import { resolveTargetUserId } from "@/lib/auth/resolve-target-user";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const userId = resolveTargetUserId(ctx, searchParams.get("userId"));
  const audience = (searchParams.get('audience') ?? 'player') as "player" | "teacher" | "organization" | "platform"; return NextResponse.json(generateCompetitiveDashboard({ userId, audience }));
});
