/** GET /api/digital-twins/twins/:twinType/:entityId/history — Get twin historical snapshots */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getTwinHistory } from "@/features/digital-twins";
import { z } from "zod";

const schema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});

export const GET = withErrorHandler<{ twinType: string; entityId: string }>(async (req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const { twinType, entityId } = await ctx.params;
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams);
  const { days } = schema.parse(params);
  const history = await getTwinHistory({ twinType: twinType as any, entityId, days });
  return NextResponse.json({ snapshots: history, total: history.length });
});
