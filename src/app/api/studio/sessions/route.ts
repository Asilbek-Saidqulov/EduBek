/** GET+POST /api/studio/sessions — List/start experience sessions */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listSessions, startSession, updateSessionProgress, completeSession } from "@/features/learning-studio";
import { z } from "zod";

const startSchema = z.object({ experienceId: z.string().min(1) });
const updateSchema = z.object({
  action: z.enum(["update", "complete"]), sessionId: z.string().min(1),
  progress: z.number().int().min(0).max(100).optional(),
  state: z.record(z.string(), z.unknown()).optional(),
  interaction: z.object({ type: z.string(), data: z.record(z.string(), z.unknown()) }).optional(),
  score: z.number().min(0).max(100).optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const sessions = await listSessions({
    userId: ctx.userId,
    experienceId: url.searchParams.get("experienceId") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 100),
  });
  return NextResponse.json({ sessions, total: sessions.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  if (url.searchParams.get("action") === "update" || url.searchParams.get("action") === "complete") {
    const body = updateSchema.parse(await req.json());
    if (body.action === "update") {
      const session = await updateSessionProgress(body.sessionId, body.progress ?? 0, body.state, body.interaction);
      return NextResponse.json(session);
    } else {
      const session = await completeSession(body.sessionId, body.score);
      return NextResponse.json(session);
    }
  }
  const body = startSchema.parse(await req.json());
  const session = await startSession({ experienceId: body.experienceId, userId: ctx.userId });
  return NextResponse.json(session, { status: 201 });
});
