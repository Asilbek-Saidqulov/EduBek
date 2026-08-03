/** GET /api/product/context — Build unified user context */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { buildUnifiedContext } from "@/features/product-intelligence";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const url = new URL(req.url);
  const organizationId = url.searchParams.get("organizationId");
  const classroomId = url.searchParams.get("classroomId");
  const context = await buildUnifiedContext({
    ctx,
    organizationId: organizationId ?? null,
    classroomId: classroomId ?? null,
  });
  return NextResponse.json(context);
});
