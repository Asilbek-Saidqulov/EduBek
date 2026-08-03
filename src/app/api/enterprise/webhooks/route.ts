/**
 * GET  /api/enterprise/webhooks — List webhook endpoints
 * POST /api/enterprise/webhooks — Create a webhook endpoint
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listWebhookEndpoints, createWebhookEndpoint } from "@/features/enterprise-integration";
import { z } from "zod";

const schema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).default(["*"]),
  organizationId: z.string().optional(),
  maxRetries: z.number().int().min(0).max(10).default(3),
  retryBackoffMs: z.number().int().min(1000).max(300000).default(5000),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const endpoints = await listWebhookEndpoints({
    ownerId: url.searchParams.get("ownerId") ?? undefined,
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 100),
  });
  return NextResponse.json({ endpoints, total: endpoints.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = schema.parse(await req.json());
  const endpoint = await createWebhookEndpoint({ ...body, ownerId: ctx.userId });
  return NextResponse.json(endpoint, { status: 201 });
});
