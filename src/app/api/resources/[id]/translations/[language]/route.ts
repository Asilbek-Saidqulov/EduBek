/**
 * GET    /api/resources/[id]/translations/[language]  — get a specific translation
 * PATCH  /api/resources/[id]/translations/[language]  — update a translation
 * DELETE /api/resources/[id]/translations/[language]  — delete a translation
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  getResourceTranslation,
  updateResourceTranslation,
  deleteResourceTranslation,
  updateResourceTranslationBodySchema,
} from "@/features/content-translation";

export const GET = withErrorHandler<{ id: string; language: string }>(
  async (_req, ctx: RouteContext<{ id: string; language: string }>) => {
    const authCtx = await getAuthContext();
    const { id, language } = await ctx.params;
    const translation = await getResourceTranslation(authCtx, id, language);
    return NextResponse.json(translation);
  },
);

export const PATCH = withErrorHandler<{ id: string; language: string }>(
  async (req, ctx: RouteContext<{ id: string; language: string }>) => {
    const authCtx = await getAuthContext();
    const { id, language } = await ctx.params;
    const body = updateResourceTranslationBodySchema.parse(await req.json());
    const translation = await updateResourceTranslation(authCtx, id, language, body);
    return NextResponse.json(translation);
  },
);

export const DELETE = withErrorHandler<{ id: string; language: string }>(
  async (_req, ctx: RouteContext<{ id: string; language: string }>) => {
    const authCtx = await getAuthContext();
    const { id, language } = await ctx.params;
    const result = await deleteResourceTranslation(authCtx, id, language);
    return NextResponse.json(result);
  },
);
