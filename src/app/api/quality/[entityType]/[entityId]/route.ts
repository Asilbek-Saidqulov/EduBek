/**
 * GET  /api/quality/:entityType/:entityId — Get cached quality analysis
 * POST /api/quality/:entityType/:entityId — Re-analyze quality (provide title + content)
 */
import { NextResponse } from "next/server";
import { withErrorHandler, notFound } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getResourceQuality, analyzeResourceQuality } from "@/features/knowledge-intelligence";
import { z } from "zod";

const postSchema = z.object({
  title: z.string().min(1).max(300),
  content: z.string(),
  subject: z.string().max(100).optional(),
});

export const GET = withErrorHandler<{ entityType: string; entityId: string }>(async (_req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const { entityType, entityId } = await ctx.params;
  const quality = await getResourceQuality(entityType, entityId);
  if (!quality) throw notFound("Quality analysis not found");
  return NextResponse.json(quality);
});

export const POST = withErrorHandler<{ entityType: string; entityId: string }>(async (req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const { entityType, entityId } = await ctx.params;
  const body = postSchema.parse(await req.json());
  const quality = await analyzeResourceQuality({
    entityType,
    entityId,
    title: body.title,
    content: body.content,
    subject: body.subject,
  });
  return NextResponse.json(quality, { status: 201 });
});
