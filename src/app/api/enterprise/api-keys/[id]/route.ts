/** DELETE /api/enterprise/api-keys/:id — Revoke an API key */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { revokeApiKey } from "@/features/enterprise-integration";

export const DELETE = withErrorHandler<{ id: string }>(async (_req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const { id } = await ctx.params;
  await revokeApiKey(id);
  return NextResponse.json({ success: true });
});
