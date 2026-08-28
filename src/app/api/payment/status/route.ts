import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth";
import { getPaymentIntentStatus } from "@/features/economy/payments";
import { getOrderDto } from "@/features/economy/orders";

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext().catch(() => null);
    if (!authContext?.userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Sign in required" } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const intentId = searchParams.get("intentId");
    const orderId = searchParams.get("orderId");

    if (intentId) {
      const intent = getPaymentIntentStatus(intentId);
      const order = getOrderDto(intent.orderId);
      return NextResponse.json({ intent, order });
    }

    if (orderId) {
      const order = getOrderDto(orderId);
      return NextResponse.json({ order });
    }

    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "intentId or orderId is required" } },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[GET /api/payment/status error]:", error);
    return NextResponse.json(
      { error: { code: error.code || "STATUS_CHECK_FAILED", message: error.message } },
      { status: error.status || 500 }
    );
  }
}
