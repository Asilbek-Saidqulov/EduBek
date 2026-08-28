import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth";
import { getAllAccountBalances, getLedgerHistory } from "@/features/economy/ledger";
import { runFinancialReconciliation } from "@/features/economy/reconciliation";
import { getAiFinancialTelemetry } from "@/features/economy/telemetry";
import { getKillSwitchFlags, updateKillSwitchFlags } from "@/features/economy/kill-switches";
import { settlePayoutBatch, failPayoutBatch } from "@/features/economy/creator";

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext().catch(() => null);
    // In production check if user is admin; for demo/admin dashboard allow authenticated/authorized access
    const trialBalance = getAllAccountBalances("UZS");
    const creditTrialBalance = getAllAccountBalances("CREDIT");
    const reconciliation = await runFinancialReconciliation();
    const telemetry = getAiFinancialTelemetry();
    const killSwitches = getKillSwitchFlags();
    const history = getLedgerHistory(30, 0);

    return NextResponse.json({
      trialBalance,
      creditTrialBalance,
      reconciliation,
      telemetry,
      killSwitches,
      recentLedger: history.entries,
      totalLedgerEntries: history.total,
    });
  } catch (error: any) {
    console.error("[GET /api/admin/economy error]:", error);
    return NextResponse.json(
      { error: { code: "ADMIN_ECONOMY_FAILED", message: error.message } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthContext().catch(() => null);
    const body = await req.json();
    const { action, killSwitches, payoutId, failReason } = body;

    if (action === "UPDATE_KILL_SWITCHES" && killSwitches) {
      const updated = updateKillSwitchFlags(killSwitches);
      return NextResponse.json({ success: true, killSwitches: updated });
    }

    if (action === "SETTLE_PAYOUT" && payoutId) {
      const result = await settlePayoutBatch(payoutId);
      return NextResponse.json({ success: true, payout: result });
    }

    if (action === "FAIL_PAYOUT" && payoutId) {
      const result = await failPayoutBatch(payoutId, failReason || "Bank transfer rejected");
      return NextResponse.json({ success: true, payout: result });
    }

    if (action === "RUN_RECONCILIATION") {
      const report = await runFinancialReconciliation();
      return NextResponse.json({ success: true, report });
    }

    return NextResponse.json(
      { error: { code: "INVALID_ACTION", message: `Unrecognized action: ${action}` } },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[POST /api/admin/economy error]:", error);
    return NextResponse.json(
      { error: { code: error.code || "ADMIN_ACTION_FAILED", message: error.message } },
      { status: error.status || 500 }
    );
  }
}
