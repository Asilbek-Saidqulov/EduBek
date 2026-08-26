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
            message: "You must be signed in to view your token history.",
          },
        },
        { status: 401 }
      );
    }

    const userId = authContext.userId;
    const { searchParams } = new URL(req.url);

    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));

    const wallet = await db.wallet.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!wallet) {
      return NextResponse.json({
        entries: [],
        total: 0,
      });
    }

    const [entries, total] = await Promise.all([
      db.eduTokenLedger.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        select: {
          id: true,
          walletId: true,
          delta: true,
          balanceAfter: true,
          reason: true,
          referenceType: true,
          referenceId: true,
          createdAt: true,
        },
      }),
      db.eduTokenLedger.count({
        where: { walletId: wallet.id },
      }),
    ]);

    return NextResponse.json({
      entries,
      total,
    });
  } catch (error: any) {
    console.error("[GET /api/wallet/history error]:", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to retrieve transaction history.",
        },
      },
      { status: 500 }
    );
  }
}
