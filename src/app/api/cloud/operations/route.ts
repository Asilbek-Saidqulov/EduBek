/** GET /api/cloud/operations — Cloud Operations Center dashboard */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getOperationsCenter } from "@/features/cloud-infra";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const dashboard = await getOperationsCenter(url.searchParams.get("organizationId") ?? undefined);
  return NextResponse.json(dashboard);
});
