/**
 * GET  /api/marketplace/categories/[id]/translations  — list category translations
 * POST /api/marketplace/categories/[id]/translations  — upsert a category translation
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  getCategoryTranslations,
  upsertCategoryTranslation,
  upsertCategoryTranslationBodySchema,
} from "@/features/content-translation";

export const GET = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const translations = await getCategoryTranslations(authCtx, id);
    return NextResponse.json({ translations });
  },
);

export const POST = withErrorHandler<{ id: string }>(
  async (req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const body = upsertCategoryTranslationBodySchema.parse(await req.json());
    const translation = await upsertCategoryTranslation(authCtx, id, body);
    return NextResponse.json(translation, { status: 201 });
  },
);
