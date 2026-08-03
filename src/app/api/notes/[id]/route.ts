/**
 * GET  /api/notes/:id — Get a note
 * PATCH /api/notes/:id — Update note (creates a new version)
 */
import { NextResponse } from "next/server";
import { withErrorHandler, notFound } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getNote, updateNote } from "@/features/collaboration";
import { z } from "zod";

const patchSchema = z.object({
  content: z.string().optional(),
  title: z.string().min(1).max(300).optional(),
  editSummary: z.string().max(500).optional(),
  visibility: z.enum(["private", "shared", "classroom", "group", "public"]).optional(),
});

export const GET = withErrorHandler<{ id: string }>(async (_req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const { id } = await ctx.params;
  const note = await getNote(id);
  if (!note) throw notFound("Note not found");
  return NextResponse.json(note);
});

export const PATCH = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const { id } = await ctx.params;
  const body = patchSchema.parse(await req.json());
  const note = await updateNote({ noteId: id, userId: authCtx.userId, ...body });
  return NextResponse.json(note);
});
