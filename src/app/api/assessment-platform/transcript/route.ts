/**
 * GET  /api/assessment-platform/transcript — Get transcript (?userId=)
 * POST /api/assessment-platform/transcript — Rebuild transcript (?userId=)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getTranscript, rebuildTranscript } from "@/features/assessment-platform";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId") ?? ctx.userId;
  const transcript = await getTranscript(userId);
  return NextResponse.json(transcript);
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId") ?? ctx.userId;
  const transcript = await rebuildTranscript(userId);
  return NextResponse.json(transcript, { status: 201 });
});
