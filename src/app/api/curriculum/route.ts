/**
 * GET /api/curriculum — List curriculum mappings (filter by standardId/entityType/entityId/coverageLevel)
 * POST /api/curriculum/analyze — Auto-map an entity to curriculum standards
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listMappings, autoMapEntityToStandards, getMappingsForEntity } from "@/features/knowledge-intelligence";
import { z } from "zod";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const url = new URL(req.url);

  // Convenience: if entityType + entityId provided, return mappings + standard details
  const entityType = url.searchParams.get("entityType");
  const entityId = url.searchParams.get("entityId");
  if (entityType && entityId) {
    const mappings = await getMappingsForEntity(entityType, entityId);
    return NextResponse.json({ mappings, total: mappings.length });
  }

  const mappings = await listMappings({
    standardId: url.searchParams.get("standardId") ?? undefined,
    entityType: entityType ?? undefined,
    entityId: entityId ?? undefined,
    coverageLevel: url.searchParams.get("coverageLevel") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 100),
  });
  return NextResponse.json({ mappings, total: mappings.length });
});
