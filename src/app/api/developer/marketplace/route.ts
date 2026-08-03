/** GET /api/developer/marketplace — Developer marketplace report (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { generateMarketplaceReport } from "@/features/developer-platform";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const report = typeof generateMarketplaceReport === 'function' ? generateMarketplaceReport() : await generateMarketplaceReport();
  return NextResponse.json(report);
});
