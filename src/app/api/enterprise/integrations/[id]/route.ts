/** GET /api/enterprise/integrations/:id — Get integration; PATCH :id — Update status */
import { NextResponse } from "next/server";
import { withErrorHandler, notFound } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getIntegration, updateIntegrationStatus } from "@/features/enterprise-integration";
import { z } from "zod";

export const GET = withErrorHandler<{ id: string }>(async (_req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const { id } = await ctx.params;
  const integration = await getIntegration(id);
  if (!integration) throw notFound("Integration not found");
  return NextResponse.json(integration);
});

const patchSchema = z.object({ status: z.enum(["pending", "connected", "disconnected", "error", "paused"]) });

export const PATCH = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const { id } = await ctx.params;
  const body = patchSchema.parse(await req.json());
  const integration = await updateIntegrationStatus(id, body.status);
  return NextResponse.json(integration);
});
