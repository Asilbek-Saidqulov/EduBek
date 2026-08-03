/**
 * GET /api/certificates/[id]  — get a certificate
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getCertificate } from "@/features/certificate";

export const GET = withErrorHandler<{ id: string }>(
  async (_req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const cert = await getCertificate(authCtx, id);
    return NextResponse.json(cert);
  },
);
