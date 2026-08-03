/**
 * POST /api/assignments  — create an assignment (draft)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  createAssignment,
  createAssignmentBodySchema,
} from "@/features/assignment";

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const body = createAssignmentBodySchema.parse(await req.json());
  const assignment = await createAssignment(ctx, body);
  return NextResponse.json(assignment, { status: 201 });
});
