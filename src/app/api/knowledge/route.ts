/**
 * GET /api/knowledge/gaps — List knowledge gaps (filter by scopeType/scopeId/type/status)
 * POST /api/knowledge/gaps/:id/resolve — Resolve a gap (POST /api/knowledge/gaps/:id?action=resolve|ignore)
 *
 * Implemented as /api/knowledge (list gaps) for simplicity.
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listKnowledgeGaps } from "@/features/knowledge-intelligence";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const url = new URL(req.url);
  const gaps = await listKnowledgeGaps({
    scopeType: url.searchParams.get("scopeType") ?? undefined,
    scopeId: url.searchParams.get("scopeId") ?? undefined,
    type: url.searchParams.get("type") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 100),
  });
  return NextResponse.json({ gaps, total: gaps.length });
});
