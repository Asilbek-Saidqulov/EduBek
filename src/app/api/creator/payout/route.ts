import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth";
import { requestCreatorPayout, listCreatorPayouts } from "@/features/economy/creator";

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext().catch(() => null);
    if (!authContext?.userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Sign in required" } },
        { status: 401 }
      );
    }

    const payouts = listCreatorPayouts(authContext.userId);
    return NextResponse.json({ payouts });
  } catch (error: any) {
    console.error("[GET /api/creator/payout error]:", error);
    return NextResponse.json(
      { error: { code: error.code || "PAYOUT_LIST_FAILED", message: error.message } },
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
    const { amountUzs, destination, destinationType } = body;

    if (!amountUzs || !destination) {
      return NextResponse.json(
        { error: { code: "INVALID_REQUEST", message: "amountUzs and destination are required" } },
        { status: 400 }
      );
    }

    const payout = await requestCreatorPayout({
      creatorId: authContext.userId,
      amountMinor: BigInt(amountUzs),
      destination,
      destinationType: destinationType || "UZCARD",
    });

    return NextResponse.json({ success: true, payout });
  } catch (error: any) {
    console.error("[POST /api/creator/payout error]:", error);
    return NextResponse.json(
      { error: { code: error.code || "PAYOUT_REQUEST_FAILED", message: error.message } },
      { status: error.status || 500 }
    );
  }
}
