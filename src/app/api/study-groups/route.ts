/**
 * GET  /api/study-groups — List study groups
 * POST /api/study-groups — Create a study group
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { createStudyGroup, listStudyGroups } from "@/features/collaboration";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  visibility: z.enum(["public", "private", "invite_only"]).default("public"),
  classroomId: z.string().optional(),
  organizationId: z.string().optional(),
  subject: z.string().max(100).optional(),
  maxMembers: z.number().int().min(2).max(500).default(50),
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
  const result = await listStudyGroups({
    userId: ctx.userId,
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    subject: url.searchParams.get("subject") ?? undefined,
    visibility: url.searchParams.get("visibility") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
    offset: Number(url.searchParams.get("offset") ?? 0),
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
  const group = await createStudyGroup({ ...body, ownerId: ctx.userId });
  return NextResponse.json(group, { status: 201 });
});
