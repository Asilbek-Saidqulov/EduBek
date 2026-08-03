/**
 * GET  /api/resources/[id]/translations  — list all translations for a resource
 * POST /api/resources/[id]/translations  — create a new translation
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  getResourceTranslations,
  createResourceTranslation,
  createResourceTranslationBodySchema,
} from "@/features/content-translation";

export const GET = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const translations = await getResourceTranslations(authCtx, id);
    return NextResponse.json({ translations });
  },
);

export const POST = withErrorHandler<{ id: string }>(
  async (req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const body = createResourceTranslationBodySchema.parse(await req.json());
    const translation = await createResourceTranslation(authCtx, id, body);
    return NextResponse.json(translation, { status: 201 });
  },
);
