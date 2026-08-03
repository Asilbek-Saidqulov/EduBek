/**
 * POST /api/assignments/[id]/archive  — archive assignment
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { archiveAssignment } from "@/features/assignment";

export const POST = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const { id } = (await ctx.params) as { id: string };
  const auth = await getAuthContext();
  return NextResponse.json(await archiveAssignment(auth, id));
});
