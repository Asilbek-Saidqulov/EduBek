/** GET /api/trust/status — Platform status */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getTrustStatus } from "@/features/trust-platform";

export const GET = withErrorHandler(async () => {
  return NextResponse.json(getTrustStatus());
});
