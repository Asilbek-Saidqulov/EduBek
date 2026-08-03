/** GET /api/social/reputation — Social platform reputation (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getReputationForUser, getTopReputableUsers } from "@/features/social-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const targetId = searchParams.get('userId') ?? ctx.userId; return NextResponse.json({ reputation: getReputationForUser(targetId), top: getTopReputableUsers(10) });
});
