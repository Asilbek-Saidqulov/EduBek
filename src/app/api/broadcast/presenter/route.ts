/** GET /api/broadcast/presenter — Broadcast presenter (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getPresenterState } from "@/features/broadcast-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const matchId = searchParams.get('matchId') ?? ''; const userId = searchParams.get('userId') ?? ctx.userId; return NextResponse.json({ presenter: getPresenterState(matchId, userId) });
});
