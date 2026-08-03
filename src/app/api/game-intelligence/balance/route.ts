/** GET /api/game-intelligence/balance — Intelligence balance (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { generateBalanceReport, getBalanceFindingsForMode } from "@/features/game-intelligence";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const mode = (searchParams.get('mode') ?? 'classic_quiz') as never; return NextResponse.json({ report: generateBalanceReport(mode), findings: getBalanceFindingsForMode(mode) });
});
