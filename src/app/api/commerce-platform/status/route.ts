/** GET /api/commerce-platform/status — Platform status (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getCommerceStatus } from "@/features/commerce-platform";

export const GET = withErrorHandler(async () => {
  return NextResponse.json(getCommerceStatus());
});
