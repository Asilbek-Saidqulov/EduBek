/**
 * POST /api/certificates/[id]/revoke  — revoke a certificate
 *   Body: { reason: string }
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  revokeCertificate,
  revokeCertificateBodySchema,
} from "@/features/certificate";

export const POST = withErrorHandler<{ id: string }>(
  async (req, ctx: RouteContext<{ id: string }>) => {
    const authCtx = await getAuthContext();
    const { id } = await ctx.params;
    const body = revokeCertificateBodySchema.parse(await req.json());
    const result = await revokeCertificate(authCtx, id, body);
    return NextResponse.json(result);
  },
);
