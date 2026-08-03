/** GET /api/developer/webhooks — Developer webhooks report (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { generateWebhookCatalogReport } from "@/features/developer-platform";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const report = typeof generateWebhookCatalogReport === 'function' ? generateWebhookCatalogReport() : await generateWebhookCatalogReport();
  return NextResponse.json(report);
});
