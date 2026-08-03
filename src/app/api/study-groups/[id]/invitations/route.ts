/**
 * GET  /api/study-groups/:id/invitations — List invitations for a group
 * POST /api/study-groups/:id/invitations — Send an invitation
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { inviteUser, listInvitations } from "@/features/collaboration";
import { z } from "zod";

const postSchema = z.object({
  inviteeId: z.string().optional(),
  inviteeEmail: z.string().email().optional(),
  message: z.string().max(1000).optional(),
  expiresInDays: z.number().int().min(1).max(30).optional(),
}).refine((v) => v.inviteeId || v.inviteeEmail, {
  message: "Either inviteeId or inviteeEmail must be provided",
});

export const GET = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? undefined;
  const invitations = await listInvitations({ groupId: id, status });
  return NextResponse.json({ invitations, total: invitations.length });
});

export const POST = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const { id } = await ctx.params;
  const body = postSchema.parse(await req.json());
  const invitation = await inviteUser({
    groupId: id,
    invitedBy: authCtx.userId,
    ...body,
  });
  return NextResponse.json(invitation, { status: 201 });
});
