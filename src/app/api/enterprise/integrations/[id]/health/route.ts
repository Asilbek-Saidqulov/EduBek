/** POST /api/enterprise/integrations/:id/health — Check integration health */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { checkIntegrationHealth } from "@/features/enterprise-integration";

export const POST = withErrorHandler<{ id: string }>(async (_req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const { id } = await ctx.params;
  const result = await checkIntegrationHealth(id);
  return NextResponse.json(result);
});
