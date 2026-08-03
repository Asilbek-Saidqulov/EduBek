/** GET /api/assessment-platform/blueprints/:id */
import { NextResponse } from "next/server";
import { withErrorHandler, notFound } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getBlueprint } from "@/features/assessment-platform";

export const GET = withErrorHandler<{ id: string }>(async (_req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const { id } = await ctx.params;
  const blueprint = await getBlueprint(id);
  if (!blueprint) throw notFound("Blueprint not found");
  return NextResponse.json(blueprint);
});
