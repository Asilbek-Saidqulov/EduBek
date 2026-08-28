/**
 * POST /api/assignments/[id]/attempts/[attemptId]/submit — student submits attempt for an assignment
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  submitAssignmentAttempt,
  submitAssignmentAttemptBodySchema,
} from "@/features/assignment";

export const POST = withErrorHandler<{ id: string; attemptId: string }>(
  async (req, ctx) => {
    const { id, attemptId } = (await ctx.params) as {
      id: string;
      attemptId: string;
    };
    const auth = await getAuthContext();
    const body = submitAssignmentAttemptBodySchema.parse(await req.json());
    const graded = await submitAssignmentAttempt(auth, id, attemptId, body);
    return NextResponse.json(graded);
  },
);
