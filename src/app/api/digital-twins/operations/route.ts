/**
 * GET  /api/digital-twins/operations — Get today's operations center dashboard
 * POST /api/digital-twins/operations — Generate / refresh operations
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { generateOperations, getOperations, acknowledgeOperation, resolveOperation, dismissOperation } from "@/features/digital-twins";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const url = new URL(req.url);
  const organizationId = url.searchParams.get("organizationId") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;

  const operations = await getOperations({
    organizationId,
    status,
    limit: Number(url.searchParams.get("limit") ?? 100),
  });
  return NextResponse.json({ operations, total: operations.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const url = new URL(req.url);
  const organizationId = url.searchParams.get("organizationId") ?? undefined;
  const dashboard = await generateOperations({ organizationId });
  return NextResponse.json(dashboard, { status: 201 });
});
