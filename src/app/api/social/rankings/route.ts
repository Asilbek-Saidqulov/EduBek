/** GET /api/social/rankings — Social platform rankings (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { generateRanking } from "@/features/social-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const type = (searchParams.get('type') ?? 'top_clubs') as 'top_clubs' | 'top_schools' | 'top_universities' | 'top_organizations' | 'top_teams' | 'most_active' | 'most_helpful' | 'most_competitive'; return NextResponse.json(generateRanking(type));
});
