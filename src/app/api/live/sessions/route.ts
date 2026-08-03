/**
 * POST /api/live/sessions  — create a live session (with auto-created lobby)
 * GET  /api/live/sessions  — list sessions
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  createSession,
  listSessions,
  createSessionBodySchema,
  listSessionsQuerySchema,
} from "@/features/live-session";

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const body = createSessionBodySchema.parse(await req.json());
  const session = await createSession(ctx, body);
  return NextResponse.json(session, { status: 201 });
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const url = new URL(req.url);
  const query = listSessionsQuerySchema.parse(Object.fromEntries(url.searchParams));
  const result = await listSessions(ctx, query);
  return NextResponse.json(result);
});
