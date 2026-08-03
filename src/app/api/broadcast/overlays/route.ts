/** GET /api/broadcast/overlays — Broadcast overlays (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getMatchOverlays } from "@/features/broadcast-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const matchId = searchParams.get('matchId'); return NextResponse.json({ overlays: matchId ? getMatchOverlays(matchId) : [] });
});
