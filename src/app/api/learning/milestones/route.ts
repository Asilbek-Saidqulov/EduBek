/** GET /api/learning/milestones — List the user's milestones */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listMilestones } from "@/features/learning-planner";
import { z } from "zod";

const schema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(100),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams);
  const { limit } = schema.parse(params);
  const milestones = await listMilestones(ctx.userId, limit);
  return NextResponse.json({ milestones, total: milestones.length });
});
