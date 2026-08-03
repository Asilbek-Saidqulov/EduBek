/**
 * GET  /api/enterprise/api-keys — List API keys
 * POST /api/enterprise/api-keys — Create an API key
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listApiKeys, createApiKey } from "@/features/enterprise-integration";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(200),
  scopes: z.array(z.string()).default([]),
  rateLimitPerMin: z.number().int().min(1).max(10000).default(100),
  organizationId: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const keys = await listApiKeys({
    ownerId: ctx.userId,
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json({ keys, total: keys.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = schema.parse(await req.json());
  const key = await createApiKey({
    ...body,
    ownerId: ctx.userId,
    expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
  });
  return NextResponse.json(key, { status: 201 });
});
