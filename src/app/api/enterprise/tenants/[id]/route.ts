/** GET /api/enterprise/tenants/:id — Get a tenant */
import { NextResponse } from "next/server";
import { withErrorHandler, notFound } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getTenant } from "@/features/enterprise-integration";

export const GET = withErrorHandler<{ id: string }>(async (_req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const { id } = await ctx.params;
  const tenant = await getTenant(id);
  if (!tenant) throw notFound("Tenant not found");
  return NextResponse.json(tenant);
});
