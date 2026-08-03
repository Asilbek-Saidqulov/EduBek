/**
 * GET  /api/enterprise/integrations — List integrations
 * POST /api/enterprise/integrations — Create an integration
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listIntegrations, createIntegration } from "@/features/enterprise-integration";
import { z } from "zod";

const schema = z.object({
  type: z.string().min(1),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  organizationId: z.string().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  syncSchedule: z.enum(["manual", "hourly", "daily", "weekly"]).default("manual"),
  syncEntities: z.array(z.string()).optional(),
  fieldMapping: z.record(z.string(), z.string()).optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const integrations = await listIntegrations({
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    type: url.searchParams.get("type") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 100),
  });
  return NextResponse.json({ integrations, total: integrations.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = schema.parse(await req.json());
  const integration = await createIntegration(body as any);
  return NextResponse.json(integration, { status: 201 });
});
