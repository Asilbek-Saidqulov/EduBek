/**
 * GET  /api/discussions — List discussions (filter by entityType/entityId)
 * POST /api/discussions — Create a discussion thread
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { createDiscussion, listDiscussions } from "@/features/collaboration";
import { z } from "zod";

const createSchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  title: z.string().min(1).max(300),
  pinned: z.boolean().default(false),
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
  const result = await listDiscussions({
    entityType: url.searchParams.get("entityType") ?? undefined,
    entityId: url.searchParams.get("entityId") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json(result);
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
  const discussion = await createDiscussion({ ...body, authorId: ctx.userId });
  return NextResponse.json(discussion, { status: 201 });
});
