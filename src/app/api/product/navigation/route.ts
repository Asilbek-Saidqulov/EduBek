/**
 * GET /api/product/navigation — Build cross-module navigation graph
 *
 * Query params:
 *   - entityType (required)
 *   - entityId (required)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { buildNavigationGraph } from "@/features/product-intelligence";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const url = new URL(req.url);
  const entityType = url.searchParams.get("entityType");
  const entityId = url.searchParams.get("entityId");
  if (!entityType || !entityId) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "entityType and entityId are required" } }, { status: 400 });
  }
  const graph = await buildNavigationGraph(entityType, entityId);
  return NextResponse.json(graph);
});
