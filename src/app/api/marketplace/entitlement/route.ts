import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth";
import { checkEntitlement } from "@/features/economy/marketplace";

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
    const listingId = searchParams.get("listingId");
    const sellerId = searchParams.get("sellerId") || undefined;

    if (!listingId) {
      return NextResponse.json(
        { error: { code: "INVALID_REQUEST", message: "listingId is required" } },
        { status: 400 }
      );
    }

    const result = await checkEntitlement(authContext.userId, listingId, sellerId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[GET /api/marketplace/entitlement error]:", error);
    return NextResponse.json(
      { error: { code: error.code || "ENTITLEMENT_CHECK_FAILED", message: error.message } },
      { status: error.status || 500 }
    );
  }
}
