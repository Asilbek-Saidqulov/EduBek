/**
 * GET  /api/notes — List notes (filter by owner / classroom / group / entity)
 * POST /api/notes — Create a note
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { createNote, listNotes } from "@/features/collaboration";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1).max(300),
  content: z.string().default(""),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  visibility: z.enum(["private", "shared", "classroom", "group", "public"]).default("private"),
  classroomId: z.string().optional(),
  groupId: z.string().optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const url = new URL(req.url);
  const notes = await listNotes({
    ownerId: url.searchParams.get("mine") === "true" ? ctx.userId : undefined,
    classroomId: url.searchParams.get("classroomId") ?? undefined,
    groupId: url.searchParams.get("groupId") ?? undefined,
    entityType: url.searchParams.get("entityType") ?? undefined,
    entityId: url.searchParams.get("entityId") ?? undefined,
    visibility: url.searchParams.get("visibility") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json({ notes, total: notes.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const body = createSchema.parse(await req.json());
  const note = await createNote({ ...body, ownerId: ctx.userId });
  return NextResponse.json(note, { status: 201 });
});
