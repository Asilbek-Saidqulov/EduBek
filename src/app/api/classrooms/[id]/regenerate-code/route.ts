/**
 * POST /api/classrooms/[id]/regenerate-code — teacher regenerates join code
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { regenerateJoinCode } from "@/features/classroom";

export const POST = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const { id } = (await ctx.params) as { id: string };
  const auth = await getAuthContext();
  return NextResponse.json(await regenerateJoinCode(auth, id));
});
