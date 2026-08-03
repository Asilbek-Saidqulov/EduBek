import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getPlatformRevenue } from "@/features/platform-admin";

/** GET /api/admin/revenue — platform revenue breakdown (admin only). */
export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  const revenue = await getPlatformRevenue(ctx);
  return NextResponse.json(revenue);
});
