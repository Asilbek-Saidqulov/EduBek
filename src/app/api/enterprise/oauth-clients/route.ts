/**
 * GET  /api/enterprise/oauth-clients — List OAuth clients
 * POST /api/enterprise/oauth-clients — Create an OAuth client
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listOAuthClients, createOAuthClient } from "@/features/enterprise-integration";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  redirectUris: z.array(z.string().url()).default([]),
  scopes: z.array(z.string()).default([]),
  grantTypes: z.array(z.string()).default(["client_credentials"]),
  organizationId: z.string().optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const clients = await listOAuthClients({
    ownerId: ctx.userId,
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json({ clients, total: clients.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = schema.parse(await req.json());
  const client = await createOAuthClient({ ...body, ownerId: ctx.userId });
  return NextResponse.json(client, { status: 201 });
});
