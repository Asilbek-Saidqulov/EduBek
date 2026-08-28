import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth";
import { getCreatorAccount, listCreatorPayouts } from "@/features/economy/creator";
import { MIN_CREATOR_PAYOUT_UZS, PAYOUT_FEE_UZS } from "@/features/economy/constants";

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext().catch(() => null);
    if (!authContext?.userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Sign in required" } },
        { status: 401 }
      );
    }

    const account = await getCreatorAccount(authContext.userId);
    const payouts = listCreatorPayouts(authContext.userId);

    return NextResponse.json({
      account,
      payouts,
      payoutPolicy: {
        minPayoutUzs: MIN_CREATOR_PAYOUT_UZS.toString(),
        payoutFeeUzs: PAYOUT_FEE_UZS.toString(),
        holdingPeriodDays: 7,
      },
    });
  } catch (error: any) {
    console.error("[GET /api/creator/dashboard error]:", error);
    return NextResponse.json(
      { error: { code: error.code || "CREATOR_DASHBOARD_FAILED", message: error.message } },
      { status: error.status || 500 }
    );
  }
}
