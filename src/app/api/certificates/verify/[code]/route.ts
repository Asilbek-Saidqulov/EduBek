/**
 * GET /api/certificates/verify/[code]  — public verification endpoint (no auth)
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { verifyByCode } from "@/features/certificate";

export const GET = withErrorHandler<{ code: string }>(
  async (_req, ctx: RouteContext<{ code: string }>) => {
    const { code } = await ctx.params;
    const result = await verifyByCode(code);
    return NextResponse.json(result);
  },
);
