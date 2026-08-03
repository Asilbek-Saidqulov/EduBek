/** GET /api/event-governance/producers — Event governance producers (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getAllProducerHealthRecords, getOverallHealthStats } from "@/features/event-governance-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  return NextResponse.json({ producers: getAllProducerHealthRecords(), stats: getOverallHealthStats() });
});
