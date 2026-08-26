import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext().catch(() => null);
    if (!authContext?.userId) {
      return NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "You must be signed in to view your wallet balance.",
          },
        },
        { status: 401 }
      );
    }

    const userId = authContext.userId;

    let wallet = await db.wallet.findUnique({
      where: { userId },
      select: {
        id: true,
        eduTokensBalance: true,
        fiatBalance: true,
        lockedEduTokens: true,
        currency: true,
        updatedAt: true,
      },
    });

    // If user has no wallet record yet, initialize one
    if (!wallet) {
      wallet = await db.wallet.create({
        data: {
          userId,
          eduTokensBalance: 250,
          fiatBalance: 0,
          currency: "USD",
        },
        select: {
          id: true,
          eduTokensBalance: true,
          fiatBalance: true,
          lockedEduTokens: true,
          currency: true,
          updatedAt: true,
        },
      });
    }

    return NextResponse.json({
      balance: wallet.eduTokensBalance,
      fiatBalance: wallet.fiatBalance,
      lockedEduTokens: wallet.lockedEduTokens,
      currency: wallet.currency,
      walletId: wallet.id,
      updatedAt: wallet.updatedAt,
    });
  } catch (error: any) {
    console.error("[GET /api/wallet/balance error]:", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to retrieve wallet balance.",
        },
      },
      { status: 500 }
    );
  }
}
