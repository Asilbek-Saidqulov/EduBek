/**
 * GET  /api/study-groups/:id/members — List members
 * POST /api/study-groups/:id/members — Add member (admin only) / change role
 */
import { NextResponse } from "next/server";
import { withErrorHandler, notFound } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listStudyGroupMembers, updateMemberRole } from "@/features/collaboration";
import { z } from "zod";

const postSchema = z.object({
  userId: z.string(),
  role: z.enum(["member", "moderator", "admin"]).default("member"),
});

export const GET = withErrorHandler<{ id: string }>(async (_req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const { id } = await ctx.params;
  const members = await listStudyGroupMembers(id);
  return NextResponse.json({ members, total: members.length });
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
  const member = await updateMemberRole(id, body.userId, body.role, authCtx.userId);
  return NextResponse.json(member);
});
