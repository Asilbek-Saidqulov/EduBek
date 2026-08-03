/** GET /api/enterprise/connectors — List all available connectors */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listConnectors } from "@/features/enterprise-integration";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const connectors = listConnectors();
  return NextResponse.json({ connectors, total: connectors.length });
});
