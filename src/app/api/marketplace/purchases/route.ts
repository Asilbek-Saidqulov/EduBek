import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth";
import { getUserEntitlements, purchaseMarketplaceItem } from "@/features/economy/marketplace";

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext().catch(() => null);
    if (!authContext?.userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Sign in required" } },
        { status: 401 }
      );
    }

    const purchases = getUserEntitlements(authContext.userId);
    return NextResponse.json({
      data: purchases,
      items: purchases,
      purchases,
      total: purchases.length,
    });
  } catch (error: any) {
    console.error("[GET /api/marketplace/purchases error]:", error);
    return NextResponse.json(
      { error: { code: error.code || "PURCHASES_FETCH_FAILED", message: error.message } },
      { status: error.status || 500 }
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
    const { listing, returnUrl } = body;

    if (!listing || !listing.id || !listing.sellerId) {
      return NextResponse.json(
        { error: { code: "INVALID_REQUEST", message: "Listing details (id, sellerId, priceUzs) are required" } },
        { status: 400 }
      );
    }

    const result = await purchaseMarketplaceItem({
      buyerId: authContext.userId,
      listing,
      returnUrl,
    });

    return NextResponse.json({
      success: true,
      order: result.order,
      intent: result.intent,
      checkoutUrl: result.checkoutUrl,
    });
  } catch (error: any) {
    console.error("[POST /api/marketplace/purchases error]:", error);
    return NextResponse.json(
      { error: { code: error.code || "PURCHASE_FAILED", message: error.message } },
      { status: error.status || 500 }
    );
  }
}
