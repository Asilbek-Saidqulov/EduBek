import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth";
import { SUBSCRIPTION_PLANS } from "@/features/economy/constants";
import { getUserSubscription, subscribeToPlan, cancelSubscription } from "@/features/economy/subscriptions";

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext().catch(() => null);
    const userId = authContext?.userId || "anonymous";

    const currentSub = userId !== "anonymous" ? getUserSubscription(userId) : null;

    return NextResponse.json({
      plans: Object.values(SUBSCRIPTION_PLANS).map((p) => ({
        tier: p.tier,
        name: p.name,
        priceMonthlyUzs: p.priceMonthlyUzs.toString(),
        priceYearlyUzs: p.priceYearlyUzs.toString(),
        aiCreditsMonthly: p.aiCreditsMonthly,
        features: p.features,
      })),
      currentSubscription: currentSub,
    });
  } catch (error: any) {
    console.error("[GET /api/subscriptions error]:", error);
    return NextResponse.json(
      { error: { code: "SUBSCRIPTIONS_FETCH_FAILED", message: error.message } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthContext().catch(() => null);
    if (!authContext?.userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Sign in required" } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { action, tier, returnUrl } = body;

    if (action === "CANCEL") {
      const result = await cancelSubscription(authContext.userId);
      return NextResponse.json(result);
    }

    if (!tier) {
      return NextResponse.json(
        { error: { code: "INVALID_REQUEST", message: "Subscription tier is required" } },
        { status: 400 }
      );
    }

    const result = await subscribeToPlan(authContext.userId, tier, returnUrl);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[POST /api/subscriptions error]:", error);
    return NextResponse.json(
      { error: { code: error.code || "SUBSCRIPTION_ACTION_FAILED", message: error.message } },
      { status: error.status || 500 }
    );
  }
}
