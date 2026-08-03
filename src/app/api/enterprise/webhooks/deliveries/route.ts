/** GET /api/enterprise/webhooks/deliveries — List webhook deliveries */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listWebhookDeliveries } from "@/features/enterprise-integration";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const deliveries = await listWebhookDeliveries({
    endpointId: url.searchParams.get("endpointId") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 100),
  });
  return NextResponse.json({ deliveries, total: deliveries.length });
});
