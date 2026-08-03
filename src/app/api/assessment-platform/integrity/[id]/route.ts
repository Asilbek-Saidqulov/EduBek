/** PATCH /api/assessment-platform/integrity/:id — Review an integrity check */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { reviewIntegrityCheck } from "@/features/assessment-platform";
import { z } from "zod";

const schema = z.object({ status: z.enum(["reviewed", "confirmed", "dismissed"]) });

export const PATCH = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const { id } = await ctx.params;
  const body = schema.parse(await req.json());
  await reviewIntegrityCheck(id, body.status, authCtx.userId);
  return NextResponse.json({ success: true });
});
