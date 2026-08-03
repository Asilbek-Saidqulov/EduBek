/** GET /api/product/attention — Generate attention report for the user */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { generateAttentionReport, listOpenAttentionItems } from "@/features/product-intelligence";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const url = new URL(req.url);
  const organizationId = url.searchParams.get("organizationId");
  const refresh = url.searchParams.get("refresh") === "true";
  if (refresh) {
    const report = await generateAttentionReport(ctx.userId, organizationId);
    return NextResponse.json(report);
  }
  const items = await listOpenAttentionItems(ctx.userId);
  return NextResponse.json({ items, total: items.length, generatedAt: new Date().toISOString() });
});
