/**
 * POST /api/cognitive/reason — Run the full cognitive reasoning pipeline
 *
 * Body:
 *   - query (required)
 *   - organizationId (optional)
 *   - classroomId (optional)
 *   - deterministicOnly (optional, default false)
 *   - shouldPlan (optional, default true)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { reason } from "@/features/cognitive-ai";

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { query, organizationId, classroomId, deterministicOnly, shouldPlan } = body as Record<string, unknown>;
  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "query is required" } }, { status: 400 });
  }
  const result = await reason({
    ctx,
    query,
    organizationId: organizationId ? String(organizationId) : null,
    classroomId: classroomId ? String(classroomId) : null,
    deterministicOnly: deterministicOnly === true,
    shouldPlan: shouldPlan !== false,
  });
  return NextResponse.json(result);
});
