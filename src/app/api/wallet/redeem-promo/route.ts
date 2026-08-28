import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth";
import { redeemPromoCode } from "@/features/economy/promotions";

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
    const code = body?.code;

    if (!code) {
      return NextResponse.json(
        { error: { code: "INVALID_CODE", message: "Promo code is required" } },
        { status: 400 }
      );
    }

    const result = await redeemPromoCode(authContext.userId, code);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[POST /api/wallet/redeem-promo error]:", error);
    return NextResponse.json(
      { error: { code: error.code || "REDEMPTION_FAILED", message: error.message } },
      { status: error.status || 500 }
    );
  }
}
