/**
 * GET  /api/platform/extensions — List extensions
 * POST /api/platform/extensions — Publish an extension
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listExtensions, publishExtension } from "@/features/platform-sdk";
import { z } from "zod";

const schema = z.object({
  type: z.string().min(1), name: z.string().min(1).max(200), slug: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  permissions: z.array(z.string()).default([]), hooks: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),
  pricingModel: z.enum(["free", "freemium", "paid"]).default("free"),
  priceEduTokens: z.number().int().min(0).default(0),
  minPlatformVersion: z.string().optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const extensions = await listExtensions({
    type: url.searchParams.get("type") ?? undefined,
    status: url.searchParams.get("status") ?? "published",
    developerId: url.searchParams.get("developerId") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json({ extensions, total: extensions.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = schema.parse(await req.json());
  const ext = await publishExtension({ ...body, developerId: ctx.userId, developerName: ctx.email ?? ctx.userId });
  return NextResponse.json(ext, { status: 201 });
});
