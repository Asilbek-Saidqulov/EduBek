/** GET /api/teachers/:id/recommendations — Get AI-generated teacher recommendations */
import { NextResponse } from "next/server";
import { withErrorHandler, notFound } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { generateTeacherRecommendations, listTeacherRecommendations } from "@/features/collaboration";
import { z } from "zod";

const schema = z.object({
  classroomId: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  refresh: z.enum(["true", "false"]).default("false").transform((v) => v === "true"),
});

export const GET = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  // Only the teacher themselves (or a superadmin) can view their recommendations
  const { id } = await ctx.params;
  if (id !== authCtx.userId && !authCtx.isSuperadmin) {
    throw notFound("Teacher not found");
  }

  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams);
  const parsed = schema.parse(params);

  if (parsed.refresh) {
    const recs = await generateTeacherRecommendations({
      teacherId: id,
      classroomId: parsed.classroomId,
      limit: parsed.limit,
    });
    return NextResponse.json({ recommendations: recs, total: recs.length, generated: true });
  }

  const recs = await listTeacherRecommendations({
    teacherId: id,
    classroomId: parsed.classroomId,
    type: parsed.type as any,
    status: parsed.status,
    limit: parsed.limit,
  });
  return NextResponse.json({ recommendations: recs, total: recs.length, generated: false });
});
