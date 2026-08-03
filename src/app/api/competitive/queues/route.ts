/** GET /api/competitive/queues — Competitive platform queues (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getAllQueueSizes, getQueueConfig } from "@/features/competitive-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") ?? ctx.userId;
  return NextResponse.json({ sizes: getAllQueueSizes(), configs: { solo: getQueueConfig('solo'), party: getQueueConfig('party'), ranked: getQueueConfig('ranked'), casual: getQueueConfig('casual'), tournament: getQueueConfig('tournament') } });
});
