/** GET /api/data-fabric/overview — Fabric overview dashboard */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getFabricOverview } from "@/features/data-fabric";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const overview = await getFabricOverview();
  return NextResponse.json(overview);
});
