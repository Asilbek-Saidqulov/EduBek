/**
 * POST /api/classrooms/join — student joins a classroom with a join code
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { joinClassroom, joinClassroomBodySchema } from "@/features/classroom";

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const body = joinClassroomBodySchema.parse(await req.json());
  const result = await joinClassroom(ctx, body.joinCode);
  return NextResponse.json(result);
});
