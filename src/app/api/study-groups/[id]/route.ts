/** GET /api/study-groups/:id — Get a single study group */
import { NextResponse } from "next/server";
import { withErrorHandler, notFound } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getStudyGroup } from "@/features/collaboration";

export const GET = withErrorHandler<{ id: string }>(async (_req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const { id } = await ctx.params;
  const group = await getStudyGroup(id, authCtx.userId);
  if (!group) throw notFound("Study group not found");
  return NextResponse.json(group);
});
