import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth";
import { getLedgerHistory } from "@/features/economy/ledger";
import { getUserLotsDto } from "@/features/economy/lots";
import { economyStore } from "@/features/economy/store";
import { getWalletBalance } from "@/features/wallet";

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext().catch(() => null);
    if (!authContext?.userId) {
      return NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "You must be signed in to view your wallet history.",
          },
        },
        { status: 401 }
      );
    }

    const userId = authContext.userId;
    const prismaHist = await getWalletBalance(userId).catch(() => null);
    if (prismaHist) {
      const rows = prismaHist.history.slice(offset, offset + limit).map((e) => ({
        id: e.id,
        delta: e.delta,
        balanceAfter: e.balanceAfter,
        reason: e.reason,
        referenceType: e.referenceType,
        referenceId: e.referenceId,
        createdAt: e.createdAt,
      }));
      return NextResponse.json({
        success: true,
        items: rows,
        data: rows,
        total: prismaHist.history.length,
        wallet: prismaHist.wallet,
      });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));

    // Get user-specific ledger records
    const userEntries = Array.from(economyStore.ledgerEntries.values())
      .filter((entry) =>
        entry.lines.some((l) => l.subAccount === userId) ||
        entry.description.includes(userId)
      )
      .sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime());

    const paginated = userEntries.slice(offset, offset + limit);
    const lots = getUserLotsDto(userId);

    const mappedTransactions = paginated.map((entry) => {
      const userLine = entry.lines.find((l) => l.subAccount === userId) || entry.lines[0];
      return {
        id: entry.id,
        type: entry.journalCode,
        amount: Number(userLine?.amountMinor || 0),
        currency: userLine?.currency || "UZS",
        direction: userLine?.direction || "CREDIT",
        description: entry.description,
        status: "COMPLETED",
        createdAt: entry.postedAt.toISOString(),
      };
    });

    return NextResponse.json({
      transactions: mappedTransactions,
      items: mappedTransactions,
      data: mappedTransactions,
      lots,
      total: userEntries.length,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("[GET /api/wallet/history error]:", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to retrieve wallet history.",
        },
      },
      { status: 500 }
    );
  }
}
