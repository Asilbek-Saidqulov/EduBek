/**
 * Automated 11-Point Financial Reconciliation Engine
 * Detects discrepancies between gateways, orders, lots, entitlements, creator accounts, and ledger.
 */

import { ReconciliationDiscrepancy } from "./types";
import { economyStore } from "./store";
import { getAccountBalance } from "./ledger";

export interface ReconciliationReport {
  timestamp: string;
  passed: boolean;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  discrepancies: ReconciliationDiscrepancy[];
  metrics: {
    totalOrders: number;
    totalGmvUzs: string;
    totalCreditsMinted: number;
    totalCreditsConsumed: number;
    totalCreatorPayableUzs: string;
    totalPlatformRevenueUzs: string;
  };
}

export async function runFinancialReconciliation(): Promise<ReconciliationReport> {
  const discrepancies: ReconciliationDiscrepancy[] = [];
  let checksPassed = 0;
  let totalChecks = 0;

  function runCheck(code: string, checkFn: () => { passed: boolean; desc: string; exp?: any; act?: any; id?: string }) {
    totalChecks++;
    const res = checkFn();
    if (res.passed) {
      checksPassed++;
    } else {
      discrepancies.push({
        checkCode: code,
        severity: "CRITICAL",
        description: res.desc,
        expected: String(res.exp ?? ""),
        actual: String(res.act ?? ""),
        entityId: res.id,
      });
    }
  }

  // Check 1: Provider payments vs Internal payment intents
  runCheck("CHK_01_PAYMENT_INTENTS", () => {
    let unlinkedPaidIntents = 0;
    for (const intent of economyStore.paymentIntents.values()) {
      if (intent.status === "PAID" && !economyStore.orders.has(intent.orderId)) {
        unlinkedPaidIntents++;
      }
    }
    return {
      passed: unlinkedPaidIntents === 0,
      desc: "All PAID payment intents must link to an existing Payment Order",
      exp: 0,
      act: unlinkedPaidIntents,
    };
  });

  // Check 2: PAID payments vs Fulfilled orders
  runCheck("CHK_02_PAID_VS_FULFILLED", () => {
    let unfulfilledPaidOrders = 0;
    for (const order of economyStore.orders.values()) {
      if (order.status === "PAID") {
        unfulfilledPaidOrders++;
      }
    }
    return {
      passed: unfulfilledPaidOrders === 0,
      desc: "Orders in PAID state should transition cleanly to FULFILLED",
      exp: 0,
      act: unfulfilledPaidOrders,
    };
  });

  // Check 3: AI Pack Orders vs Credit Lot Minting
  runCheck("CHK_03_AI_PACK_LOT_INTEGRITY", () => {
    let missingLots = 0;
    for (const order of economyStore.orders.values()) {
      if (order.type === "AI_CREDIT_PACK" && order.status === "FULFILLED") {
        const hasLot = Array.from(economyStore.creditLots.values()).some((l) => l.orderId === order.id);
        if (!hasLot) missingLots++;
      }
    }
    return {
      passed: missingLots === 0,
      desc: "Every fulfilled AI Pack order must have a corresponding Credit Lot",
      exp: 0,
      act: missingLots,
    };
  });

  // Check 4: AI Credits Consumed vs AI Usage Records
  runCheck("CHK_04_AI_CREDIT_CONSUMPTION_INTEGRITY", () => {
    let totalConsumedInUsages = 0;
    for (const usage of economyStore.aiUsages.values()) {
      if (usage.status === "FINALIZED") {
        totalConsumedInUsages += usage.creditsCharged;
      }
    }

    let totalConsumedInWallets = 0;
    for (const wallet of economyStore.wallets.values()) {
      totalConsumedInWallets += wallet.totalConsumed;
    }

    return {
      passed: totalConsumedInUsages === totalConsumedInWallets,
      desc: "Total credits charged across AI usage records must equal total consumed in wallets",
      exp: totalConsumedInUsages,
      act: totalConsumedInWallets,
    };
  });

  // Check 5: Marketplace Orders vs Entitlements
  runCheck("CHK_05_ENTITLEMENT_INTEGRITY", () => {
    let missingEntitlements = 0;
    for (const order of economyStore.orders.values()) {
      if (order.type === "MARKETPLACE_PRODUCT" && order.status === "FULFILLED") {
        const hasEnt = Array.from(economyStore.entitlements.values()).some(
          (e) => e.orderId === order.id && e.status === "ACTIVE"
        );
        if (!hasEnt) missingEntitlements++;
      }
    }
    return {
      passed: missingEntitlements === 0,
      desc: "Every fulfilled Marketplace order must grant an active Entitlement",
      exp: 0,
      act: missingEntitlements,
    };
  });

  // Check 6: Marketplace Sales vs Creator Balances
  runCheck("CHK_06_CREATOR_SALES_BALANCE", () => {
    let totalCreatorSharesInOrders = 0n;
    for (const order of economyStore.orders.values()) {
      if (order.type === "MARKETPLACE_PRODUCT" && order.status === "FULFILLED") {
        totalCreatorSharesInOrders += (order.quotedAmountMinor * 7000n) / 10000n;
      }
    }

    let totalCreatorAccumulated = 0n;
    for (const acc of economyStore.creatorAccounts.values()) {
      totalCreatorAccumulated += acc.pendingUzs + acc.eligibleUzs + acc.availableUzs + acc.payoutLockedUzs + acc.paidUzs;
    }

    return {
      passed: totalCreatorSharesInOrders === totalCreatorAccumulated,
      desc: "Total creator shares in fulfilled orders must equal total accumulated in creator accounts",
      exp: totalCreatorSharesInOrders.toString(),
      act: totalCreatorAccumulated.toString(),
    };
  });

  // Check 7: Wallet Available Balance vs Active Lots
  runCheck("CHK_07_WALLET_LOT_CONSISTENCY", () => {
    let inconsistentWallets = 0;
    for (const wallet of economyStore.wallets.values()) {
      const userLots = Array.from(economyStore.creditLots.values()).filter(
        (l) => l.userId === wallet.userId && l.status === "ACTIVE"
      );
      const activeSum = userLots.reduce((sum, l) => sum + l.remainingUnits, 0);
      if (wallet.availableUnits + wallet.reservedUnits !== activeSum) {
        inconsistentWallets++;
      }
    }
    return {
      passed: inconsistentWallets === 0,
      desc: "Wallet available + reserved units must match active non-exhausted lots sum",
      exp: 0,
      act: inconsistentWallets,
    };
  });

  // Check 8: Double-Entry Ledger Trial Balance (Debits === Credits)
  runCheck("CHK_08_LEDGER_TRIAL_BALANCE", () => {
    let unbalancedEntries = 0;
    for (const entry of economyStore.ledgerEntries.values()) {
      let debits = 0n;
      let credits = 0n;
      for (const line of entry.lines) {
        if (line.direction === "DEBIT") debits += line.amountMinor;
        else credits += line.amountMinor;
      }
      if (debits !== credits) unbalancedEntries++;
    }
    return {
      passed: unbalancedEntries === 0,
      desc: "All posted ledger entries must have debits === credits",
      exp: 0,
      act: unbalancedEntries,
    };
  });

  // Check 9: Payout Batches vs Creator Payout Locked & Paid
  runCheck("CHK_09_PAYOUT_BATCH_INTEGRITY", () => {
    let orphanPayouts = 0;
    for (const batch of economyStore.payoutBatches.values()) {
      if (!economyStore.creatorAccounts.has(batch.creatorId)) {
        orphanPayouts++;
      }
    }
    return {
      passed: orphanPayouts === 0,
      desc: "All payout batches must link to a valid Creator Account",
      exp: 0,
      act: orphanPayouts,
    };
  });

  // Check 10: Promo Campaign Budget Enforcement
  runCheck("CHK_10_PROMO_BUDGET_CAPS", () => {
    let overspentCampaigns = 0;
    for (const camp of economyStore.promoCampaigns.values()) {
      if (camp.usedUnits > camp.maxBudgetUnits) {
        overspentCampaigns++;
      }
    }
    return {
      passed: overspentCampaigns === 0,
      desc: "Promotional campaigns cannot exceed their configured max budget cap",
      exp: 0,
      act: overspentCampaigns,
    };
  });

  // Check 11: Non-Negative Balances Invariant
  runCheck("CHK_11_NON_NEGATIVE_BALANCES", () => {
    let negativeWallets = 0;
    for (const w of economyStore.wallets.values()) {
      if (w.availableUnits < 0 || w.reservedUnits < 0) negativeWallets++;
    }
    for (const c of economyStore.creatorAccounts.values()) {
      if (c.pendingUzs < 0n || c.availableUzs < 0n || c.payoutLockedUzs < 0n) negativeWallets++;
    }
    return {
      passed: negativeWallets === 0,
      desc: "No wallet or creator account may ever hold negative integer balances",
      exp: 0,
      act: negativeWallets,
    };
  });

  // Calculate high-level summary metrics
  let totalGmv = 0n;
  for (const o of economyStore.orders.values()) {
    if (o.status === "FULFILLED" || o.status === "PAID") {
      totalGmv += o.quotedAmountMinor;
    }
  }

  let totalCreditsMinted = 0;
  for (const l of economyStore.creditLots.values()) {
    totalCreditsMinted += l.originalUnits;
  }

  let totalCreditsConsumed = 0;
  for (const w of economyStore.wallets.values()) {
    totalCreditsConsumed += w.totalConsumed;
  }

  const creatorPayableBal = getAccountBalance("CREATOR_PAYABLE", "UZS");
  const platformRevenueBal = getAccountBalance("MARKETPLACE_COMMISSION_REVENUE", "UZS");

  return {
    timestamp: new Date().toISOString(),
    passed: discrepancies.length === 0,
    totalChecks,
    passedChecks: checksPassed,
    failedChecks: discrepancies.length,
    discrepancies,
    metrics: {
      totalOrders: economyStore.orders.size,
      totalGmvUzs: totalGmv.toString(),
      totalCreditsMinted,
      totalCreditsConsumed,
      totalCreatorPayableUzs: creatorPayableBal.netBalance.toString(),
      totalPlatformRevenueUzs: platformRevenueBal.netBalance.toString(),
    },
  };
}
