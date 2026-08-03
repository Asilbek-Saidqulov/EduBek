/**
 * GET   /api/assignments/[id]  — get assignment (with attempts for teachers)
 * PATCH /api/assignments/[id]  — update assignment (teacher only)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  getAssignment,
  updateAssignment,
  updateAssignmentBodySchema,
} from "@/features/assignment";

export const GET = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const { id } = (await ctx.params) as { id: string };
  const auth = await getAuthContext();
  return NextResponse.json(await getAssignment(auth, id));
});

export const PATCH = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const { id } = (await ctx.params) as { id: string };
  const auth = await getAuthContext();
  const body = updateAssignmentBodySchema.parse(await req.json());
  return NextResponse.json(await updateAssignment(auth, id, body));
});
