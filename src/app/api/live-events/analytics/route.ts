/** GET /api/live-events/analytics — Live events analytics (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { generateEventAnalytics } from "@/features/live-events-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get('eventId'); if (!eventId) return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'eventId required' } }, { status: 400 }); return NextResponse.json(generateEventAnalytics(eventId));
});
