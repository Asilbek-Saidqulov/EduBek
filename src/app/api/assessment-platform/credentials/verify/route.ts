/** POST /api/assessment-platform/credentials/verify — Verify a credential by verification ID */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { verifyCredential } from "@/features/assessment-platform";
import { z } from "zod";

const schema = z.object({
  verificationId: z.string().min(1),
  verifiedBy: z.string().optional(),
  method: z.string().default("url"),
  ipAddress: z.string().optional(),
});

export const POST = withErrorHandler(async (req) => {
  const body = schema.parse(await req.json());
  const result = await verifyCredential(body.verificationId, body.verifiedBy, body.method, body.ipAddress);
  return NextResponse.json(result);
});
