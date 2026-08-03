/**
 * POST /api/learning-sessions       — start a session
 * GET  /api/learning-sessions       — list my sessions
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  listMySessions,
  startSession,
  startSessionBodySchema,
} from "@/features/learning-session";

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const body = startSessionBodySchema.parse(await req.json());
  const session = await startSession(ctx, body);
  return NextResponse.json(session, { status: 201 });
});

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  const sessions = await listMySessions(ctx);
  return NextResponse.json({ sessions });
});
