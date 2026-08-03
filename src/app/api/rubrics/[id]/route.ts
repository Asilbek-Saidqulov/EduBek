/**
 * GET   /api/rubrics/[id]  — get a rubric
 * PATCH /api/rubrics/[id]  — update a rubric
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  getRubric,
  updateRubric,
  updateRubricBodySchema,
} from "@/features/rubric";

export const GET = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const rubric = await getRubric(authCtx, id);
    return NextResponse.json(rubric);
  },
);

export const PATCH = withErrorHandler<{ id: string }>(
  async (req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const body = updateRubricBodySchema.parse(await req.json());
    const updated = await updateRubric(authCtx, id, body);
    return NextResponse.json(updated);
  },
);
