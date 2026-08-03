/** GET /api/digital-twins/workflows/:id — Get a workflow */
import { NextResponse } from "next/server";
import { withErrorHandler, notFound } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getWorkflow } from "@/features/digital-twins";

export const GET = withErrorHandler<{ id: string }>(async (_req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const { id } = await ctx.params;
  const workflow = await getWorkflow(id);
  if (!workflow) throw notFound("Workflow not found");
  return NextResponse.json(workflow);
});
