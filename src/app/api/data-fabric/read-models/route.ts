/** GET /api/data-fabric/read-models — List read models (CQRS) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listReadModels, getReadModel } from "@/features/data-fabric";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);

  // If specific read model requested
  const modelType = url.searchParams.get("modelType");
  const entityType = url.searchParams.get("entityType");
  const entityId = url.searchParams.get("entityId");
  if (modelType && entityType && entityId) {
    const rm = await getReadModel(modelType, entityType, entityId);
    return NextResponse.json(rm);
  }

  const readModels = await listReadModels({
    modelType: modelType ?? undefined,
    entityType: entityType ?? undefined,
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 100),
  });
  return NextResponse.json({ readModels, total: readModels.length });
});
