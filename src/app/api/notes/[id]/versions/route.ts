/**
 * GET  /api/notes/:id/versions — List version history
 * POST /api/notes/:id/versions — Revert to a specific version (?version=N)
 */
import { NextResponse } from "next/server";
import { withErrorHandler, notFound } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listNoteVersions, revertToVersion } from "@/features/collaboration";

export const GET = withErrorHandler<{ id: string }>(async (_req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const { id } = await ctx.params;
  const versions = await listNoteVersions(id);
  return NextResponse.json({ versions, total: versions.length });
});

export const POST = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const version = Number(url.searchParams.get("version"));
  if (!Number.isFinite(version) || version < 1) throw notFound("Invalid version");
  const note = await revertToVersion(id, version, authCtx.userId);
  return NextResponse.json(note);
});
