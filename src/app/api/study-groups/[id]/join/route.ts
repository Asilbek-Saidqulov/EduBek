/** POST /api/study-groups/:id/join — Join a study group */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { joinStudyGroup } from "@/features/collaboration";

export const POST = withErrorHandler<{ id: string }>(async (_req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const { id } = await ctx.params;
  const member = await joinStudyGroup(id, authCtx.userId);
  return NextResponse.json(member, { status: 201 });
});
