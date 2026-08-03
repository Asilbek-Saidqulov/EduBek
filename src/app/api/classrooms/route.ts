/**
 * POST /api/classrooms       — create a classroom
 * GET  /api/classrooms       — list my classrooms (taught + enrolled)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  createClassroom,
  listMyClassrooms,
  createClassroomBodySchema,
} from "@/features/classroom";

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const body = createClassroomBodySchema.parse(await req.json());
  const classroom = await createClassroom(ctx, body);
  return NextResponse.json(classroom, { status: 201 });
});

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  const classrooms = await listMyClassrooms(ctx);
  return NextResponse.json({ classrooms });
});
