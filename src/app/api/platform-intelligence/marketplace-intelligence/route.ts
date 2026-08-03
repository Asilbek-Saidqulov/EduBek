/** GET /api/platform-intelligence/marketplace-intelligence — Marketplace intelligence dashboard */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getMarketplaceIntelligence } from "@/features/platform-intelligence";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const intelligence = await getMarketplaceIntelligence();
  return NextResponse.json(intelligence);
});
