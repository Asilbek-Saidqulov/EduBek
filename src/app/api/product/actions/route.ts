/**
 * GET /api/product/actions — Generate smart actions for an entity
 *
 * Query params:
 *   - entityType (required)
 *   - entityId (optional)
 *   - organizationId (optional)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { generateActions } from "@/features/product-intelligence";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const url = new URL(req.url);
  const entityType = url.searchParams.get("entityType");
  const entityId = url.searchParams.get("entityId") ?? undefined;
  const organizationId = url.searchParams.get("organizationId");
  if (!entityType) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "entityType is required" } }, { status: 400 });
  }
  const actions = await generateActions({
    userId: ctx.userId,
    roles: ctx.platformRoles,
    entityType,
    entityId: entityId ?? undefined,
    organizationId: organizationId ?? null,
  });
  return NextResponse.json(actions);
});
