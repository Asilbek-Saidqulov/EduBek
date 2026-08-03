/**
 * POST /api/peer/mentor — Request a mentorship
 * GET  /api/peer/mentor — List mentorships (as mentor or mentee)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { requestMentorship } from "@/features/collaboration";
import { db } from "@/lib/db";
import { z } from "zod";

const postSchema = z.object({
  mentorId: z.string(),
  subject: z.string().max(100).optional(),
  goals: z.array(z.string()).default([]),
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
  const role = url.searchParams.get("role") ?? "all"; // 'mentor' | 'mentee' | 'all'
  const where = role === "mentor"
    ? { mentorId: ctx.userId }
    : role === "mentee"
      ? { menteeId: ctx.userId }
      : { OR: [{ mentorId: ctx.userId }, { menteeId: ctx.userId }] };
  const mentorships = await db.mentorship.findMany({ where, orderBy: { createdAt: "desc" }, take: 50 });
  return NextResponse.json({ mentorships, total: mentorships.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const body = postSchema.parse(await req.json());
  if (body.mentorId === ctx.userId) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Cannot mentor yourself" } },
      { status: 400 },
    );
  }
  await requestMentorship({
    mentorId: body.mentorId,
    menteeId: ctx.userId,
    subject: body.subject,
    goals: body.goals,
  });
  return NextResponse.json({ success: true }, { status: 201 });
});
