/**
 * GET    /api/classrooms/[id]  — get classroom with students
 * PATCH  /api/classrooms/[id]  — update classroom (teacher only)
 * DELETE /api/classrooms/[id]  — archive classroom (teacher only)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  archiveClassroom,
  getClassroom,
  updateClassroom,
  updateClassroomBodySchema,
} from "@/features/classroom";

export const GET = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const { id } = (await ctx.params) as { id: string };
  const auth = await getAuthContext();
  return NextResponse.json(await getClassroom(auth, id));
});

export const PATCH = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const { id } = (await ctx.params) as { id: string };
  const auth = await getAuthContext();
  const body = updateClassroomBodySchema.parse(await req.json());
  return NextResponse.json(await updateClassroom(auth, id, body));
});

export const DELETE = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const { id } = (await ctx.params) as { id: string };
  const auth = await getAuthContext();
  return NextResponse.json(await archiveClassroom(auth, id));
});
