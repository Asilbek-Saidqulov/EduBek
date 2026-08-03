import { NextResponse } from "next/server";
import { withErrorHandler, badRequest } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { canUseFeature, type SubscriptionFeature } from "@/features/subscription";

const ALLOWED_FEATURES = new Set<SubscriptionFeature>([
  "ai_generate",
  "ai_premium",
  "marketplace_publish",
  "premium_templates",
  "collection_create",
  "organization_create",
]);

/**
 * GET /api/subscriptions/can-use?feature=ai_generate
 *
 * Checks whether the caller's plan permits the given feature, and returns
 * the current usage / remaining quota when applicable.
 */
export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const { searchParams } = new URL(req.url);
  const feature = searchParams.get("feature") as SubscriptionFeature | null;
  if (!feature) throw badRequest("Missing 'feature' query parameter");
  if (!ALLOWED_FEATURES.has(feature)) {
    throw badRequest(
      `Unknown feature. Allowed: ${Array.from(ALLOWED_FEATURES).join(", ")}`,
    );
  }
  const result = await canUseFeature(ctx, feature);
  return NextResponse.json(result);
});
