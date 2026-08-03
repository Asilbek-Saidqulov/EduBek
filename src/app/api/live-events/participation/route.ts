/** GET /api/live-events/participation — Live events participation (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getEventParticipations } from "@/features/live-events-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get('eventId'); return NextResponse.json({ participations: eventId ? getEventParticipations(eventId) : [] });
});
