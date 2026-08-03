/**
 * GET  /api/subscriptions/plans/[id]/translations  — list plan translations
 * POST /api/subscriptions/plans/[id]/translations  — upsert a plan translation
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  getPlanTranslations,
  upsertPlanTranslation,
  upsertPlanTranslationBodySchema,
} from "@/features/content-translation";

export const GET = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const translations = await getPlanTranslations(authCtx, id);
    return NextResponse.json({ translations });
  },
);

export const POST = withErrorHandler<{ id: string }>(
  async (req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const body = upsertPlanTranslationBodySchema.parse(await req.json());
    const translation = await upsertPlanTranslation(authCtx, id, body);
    return NextResponse.json(translation, { status: 201 });
  },
);
