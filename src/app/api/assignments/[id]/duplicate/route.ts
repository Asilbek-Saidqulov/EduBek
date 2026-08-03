/**
 * POST /api/assignments/[id]/duplicate  — copy assignment to another classroom
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  duplicateAssignment,
  duplicateAssignmentBodySchema,
} from "@/features/assignment";

export const POST = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const { id } = (await ctx.params) as { id: string };
  const auth = await getAuthContext();
  const body = duplicateAssignmentBodySchema.parse(await req.json());
  return NextResponse.json(
    await duplicateAssignment(auth, id, body),
    { status: 201 },
  );
});
