/**
 * GET /api/gradebook/classroom/[id]  — get the full classroom gradebook
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getClassroomGrades } from "@/features/gradebook";

export const GET = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const result = await getClassroomGrades(authCtx, id);
    return NextResponse.json(result);
  },
);
