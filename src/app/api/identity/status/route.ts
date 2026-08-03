/** GET /api/identity/status — Platform status */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getIdentityStatus } from "@/features/identity-platform";

export const GET = withErrorHandler(async () => {
  return NextResponse.json(getIdentityStatus());
});
