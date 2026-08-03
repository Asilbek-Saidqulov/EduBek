/**
 * POST /api/exams/[id]/proctoring  — record a proctoring incident
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  recordProctoring,
  recordProctoringBodySchema,
} from "@/features/exam";

export const POST = withErrorHandler<{ id: string }>(
  async (req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const body = recordProctoringBodySchema.parse(await req.json());
    const result = await recordProctoring(authCtx, id, body);
    return NextResponse.json(result, { status: 201 });
  },
);
