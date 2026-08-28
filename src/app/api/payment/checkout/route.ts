import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth";
import { initiateCheckout } from "@/features/economy/payments";

export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthContext().catch(() => null);
    if (!authContext?.userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Sign in required to checkout" } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { itemType, itemId, providerCode, returnUrl, idempotencyKey, customMetadata } = body;

    if (!itemType || !itemId) {
      return NextResponse.json(
        { error: { code: "INVALID_REQUEST", message: "itemType and itemId are required" } },
        { status: 400 }
      );
    }

    const result = await initiateCheckout({
      userId: authContext.userId,
      itemType,
      itemId,
      providerCode: providerCode || "CLICK",
      returnUrl,
      idempotencyKey,
      customMetadata,
    });

    return NextResponse.json({
      success: true,
      order: result.order,
      intent: result.intent,
      checkoutUrl: result.checkoutUrl,
    });
  } catch (error: any) {
    console.error("[POST /api/payment/checkout error]:", error);
    return NextResponse.json(
      {
        error: {
          code: error.code || "CHECKOUT_FAILED",
          message: error.message || "Failed to initiate payment checkout",
          details: error.details,
        },
      },
      { status: error.status || 500 }
    );
  }
}
