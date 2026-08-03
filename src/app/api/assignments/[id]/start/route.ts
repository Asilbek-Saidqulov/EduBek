/**
 * POST /api/assignments/[id]/start  — student starts an assignment
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { startAssignment } from "@/features/assignment";

export const POST = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const { id } = (await ctx.params) as { id: string };
  const auth = await getAuthContext();
  const attempt = await startAssignment(auth, id);
  return NextResponse.json(attempt, { status: 201 });
});
