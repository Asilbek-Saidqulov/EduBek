/**
 * GET /api/cognitive/retrieve — Retrieve evidence from all knowledge sources
 *
 * Query params:
 *   - query (required)
 *   - organizationId (optional)
 *   - classroomId (optional)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { retrieveEvidence } from "@/features/cognitive-ai";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const url = new URL(req.url);
  const query = url.searchParams.get("query");
  if (!query) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "query is required" } }, { status: 400 });
  }
  const organizationId = url.searchParams.get("organizationId");
  const classroomId = url.searchParams.get("classroomId");
  const evidence = await retrieveEvidence(query, {
    userId: ctx.userId,
    organizationId: organizationId ?? undefined,
    classroomId: classroomId ?? undefined,
  });
  return NextResponse.json(evidence);
});
