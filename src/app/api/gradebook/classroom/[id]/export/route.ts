/**
 * GET /api/gradebook/classroom/[id]/export  — export the classroom gradebook as flat rows
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { exportGradebook } from "@/features/gradebook";

export const GET = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const result = await exportGradebook(authCtx, id);
    return NextResponse.json(result);
  },
);
