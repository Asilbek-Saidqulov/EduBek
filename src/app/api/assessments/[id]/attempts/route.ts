/**
 * GET /api/assessments/[id]/attempts  — list attempts for this assessment
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listAttempts, listAttemptsQuerySchema } from "@/features/assessment";

export const GET = withErrorHandler<{ id: string }>(
  async (req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const url = new URL(req.url);
    const query = listAttemptsQuerySchema.parse({
      ...Object.fromEntries(url.searchParams),
      assessmentId: id,
    });
    const result = await listAttempts(authCtx, query);
    return NextResponse.json(result);
  },
);
