/** GET /api/social/clubs — Social platform clubs (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listClubs, getClubById } from "@/features/social-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const clubId = searchParams.get('clubId'); if (clubId) { const c = getClubById(clubId); if (!c) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Club not found' } }, { status: 404 }); return NextResponse.json(c); } return NextResponse.json({ clubs: listClubs() });
});
