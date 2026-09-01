import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth";
import { getUserAiCredits } from "@/features/economy/credits";
import { getCreatorAccount } from "@/features/economy/creator";
import { getUserSubscription } from "@/features/economy/subscriptions";
import { getWalletBalance } from "@/features/wallet";

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

    // Fetch AI Credits (available, reserved, totalConsumed, lots, expiringSoon)
    const prismaWallet = await getWalletBalance(userId).catch(() => null);
    const aiCredits = await getUserAiCredits(userId);
    const creator = await getCreatorAccount(userId);
    const subscription = getUserSubscription(userId);

    return NextResponse.json({
      // Backward compatibility fields
      balance: prismaWallet?.wallet.eduTokensBalance ?? aiCredits.availableUnits,
      eduTokensBalance: prismaWallet?.wallet.eduTokensBalance ?? 0,
      fiatBalance: prismaWallet?.wallet.fiatBalance ?? Number(creator.availableUzs) || 0,
      lockedEduTokens: aiCredits.reservedUnits,
      currency: "UZS",
      walletId: aiCredits.id,
      updatedAt: aiCredits.updatedAt,

      // Phase 3 rich fields
      aiCredits: {
        available: aiCredits.availableUnits,
        reserved: aiCredits.reservedUnits,
        totalConsumed: aiCredits.totalConsumed,
        expiringSoon: aiCredits.expiringSoonUnits || 0,
        nearestExpiration: aiCredits.nearestExpiration || null,
        lots: aiCredits.lots,
      },
      creatorBalance: {
        pendingUzs: creator.pendingUzs,
        eligibleUzs: creator.eligibleUzs,
        availableUzs: creator.availableUzs,
        payoutLockedUzs: creator.payoutLockedUzs,
        paidUzs: creator.paidUzs,
      },
      subscription: {
        tier: subscription.tier,
        planName: subscription.planName,
        status: subscription.status,
        monthlyQuota: subscription.monthlyQuota,
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
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
