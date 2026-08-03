/**
 * POST /api/study-groups/invitations/:token/accept — Accept invitation
 * POST /api/study-groups/invitations/:token/decline — Decline invitation
 *
 * (We accept the action via query param to keep one route — ?action=accept|decline)
 */
import { NextResponse } from "next/server";
import { withErrorHandler, notFound } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { acceptInvitation, declineInvitation } from "@/features/collaboration";

export const POST = withErrorHandler<{ token: string }>(async (req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const { token } = await ctx.params;
  const url = new URL(req.url);
  const action = url.searchParams.get("action") ?? "accept";

  if (action === "decline") {
    await declineInvitation(token);
    return NextResponse.json({ success: true, action: "declined" });
  }

  const member = await acceptInvitation(token, authCtx.userId);
  return NextResponse.json(member, { status: 201 });
});
