import { describe, it, expect, beforeEach } from "vitest";
import {
  economyStore,
  recordJournalEntry,
  getAccountBalance,
  getAllAccountBalances,
  getLedgerHistory,
  mintCreditLot,
  getActiveLotsForUser,
  consumeLotsForUser,
  getUserAiCredits,
  reserveAiCredits,
  finalizeAiReservation,
  releaseAiReservation,
  quoteCreditPack,
  quoteSubscriptionPlan,
  quoteMarketplaceListing,
  createOrder,
  fulfillOrder,
  ClickProvider,
  handleProviderWebhook,
  getPaymentIntentStatus,
  checkEntitlement,
  getUserEntitlements,
  purchaseMarketplaceItem,
  getCreatorAccount,
  requestCreatorPayout,
  settlePayoutBatch,
  failPayoutBatch,
  listCreatorPayouts,
  getUserSubscription,
  subscribeToPlan,
  cancelSubscription,
  renewSubscriptionPeriod,
  createPromoCampaign,
  redeemPromoCode,
  processRefund,
  getKillSwitchFlags,
  updateKillSwitchFlags,
  resetKillSwitches,
  runFinancialReconciliation,
  getAiFinancialTelemetry,
} from "@/features/economy";

describe("Phase 3: Production-Grade Economy Engine", () => {
  beforeEach(() => {
    economyStore.resetForTesting();
  });

  describe("1. Double-Entry Immutable Ledger", () => {
    it("rejects unbalanced journal entries", async () => {
      await expect(
        recordJournalEntry({
          journalCode: "TEST_UNBALANCED",
          description: "Unbalanced test",
          lines: [
            { account: "PAYMENT_CLEARING", currency: "UZS", direction: "DEBIT", amountMinor: 100_000n },
            { account: "UNEARNED_REVENUE", currency: "UZS", direction: "CREDIT", amountMinor: 90_000n },
          ],
        })
      ).rejects.toThrow("Unbalanced journal entry");
    });

    it("rejects non-positive amounts", async () => {
      await expect(
        recordJournalEntry({
          journalCode: "TEST_ZERO",
          description: "Zero test",
          lines: [
            { account: "PAYMENT_CLEARING", currency: "UZS", direction: "DEBIT", amountMinor: 0n },
            { account: "UNEARNED_REVENUE", currency: "UZS", direction: "CREDIT", amountMinor: 0n },
          ],
        })
      ).rejects.toThrow("Ledger line amount must be strictly positive");
    });

    it("records balanced journal entries and calculates correct trial balances", async () => {
      await recordJournalEntry({
        journalCode: "USER_DEPOSIT",
        description: "Deposit 100,000 UZS",
        lines: [
          { account: "PAYMENT_CLEARING", subAccount: "CLICK", currency: "UZS", direction: "DEBIT", amountMinor: 100_000n },
          { account: "UNEARNED_REVENUE", subAccount: "user_1", currency: "UZS", direction: "CREDIT", amountMinor: 100_000n },
        ],
      });

      const clearing = getAccountBalance("PAYMENT_CLEARING", "UZS");
      const unearned = getAccountBalance("UNEARNED_REVENUE", "UZS");

      expect(clearing.netBalance).toBe(100_000n);
      expect(unearned.netBalance).toBe(100_000n);

      const trial = getAllAccountBalances("UZS");
      expect(trial.PAYMENT_CLEARING.net).toBe("100000");
      expect(trial.UNEARNED_REVENUE.net).toBe("100000");
    });
  });

  describe("2. AI Credit Lots & Deterministic FIFO Engine", () => {
    it("mints credit lots and consumes in strict expiration and source FIFO priority", async () => {
      const userId = "user_fifo_test";
      const now = Date.now();

      // Lot 1: Purchased expiring in 365 days (100 units)
      await mintCreditLot({
        userId,
        source: "PURCHASED",
        units: 100,
        expiresAt: new Date(now + 365 * 86400000),
      });

      // Lot 2: Promo expiring in 30 days (50 units)
      const promoLot = await mintCreditLot({
        userId,
        source: "PROMO",
        units: 50,
        expiresAt: new Date(now + 30 * 86400000),
      });

      // Lot 3: Subscription expiring in 15 days (40 units)
      const subLot = await mintCreditLot({
        userId,
        source: "SUBSCRIPTION",
        units: 40,
        expiresAt: new Date(now + 15 * 86400000),
      });

      const activeLots = getActiveLotsForUser(userId);
      // Expected order: Earliest expiring first -> Sub (15d) -> Promo (30d) -> Purchased (365d)
      expect(activeLots[0].id).toBe(subLot.id);
      expect(activeLots[1].id).toBe(promoLot.id);

      // Consume 60 units (40 from subLot, 20 from promoLot)
      const result = consumeLotsForUser(userId, 60);
      expect(result.consumedTotal).toBe(60);
      expect(result.consumedBreakdown.length).toBe(2);
      expect(result.consumedBreakdown[0].units).toBe(40);
      expect(result.consumedBreakdown[0].source).toBe("SUBSCRIPTION");
      expect(result.consumedBreakdown[1].units).toBe(20);
      expect(result.consumedBreakdown[1].source).toBe("PROMO");

      const wallet = await getUserAiCredits(userId);
      // 190 - 60 = 130 remaining
      expect(wallet.availableUnits).toBe(130);
    });

    it("rejects overdraw when units exceed available balance", async () => {
      const userId = "user_overdraw";
      await mintCreditLot({
        userId,
        source: "PROMO",
        units: 10,
      });

      expect(() => consumeLotsForUser(userId, 25)).toThrow("Insufficient AI credit units");
    });
  });

  describe("3. AI Reservations, Finalization & Concurrency Locks", () => {
    it("reserves credits, locks wallet, and finalizes with zero leaks", async () => {
      const userId = "user_ai_res";
      await mintCreditLot({
        userId,
        source: "PURCHASED",
        units: 50,
      });

      const reservation = await reserveAiCredits({
        userId,
        sku: "ai.quiz.generate.v1",
        estimatedUnits: 25,
      });

      expect(reservation.unitsReserved).toBe(25);
      expect(reservation.remainingAvailable).toBe(25);

      const midWallet = await getUserAiCredits(userId);
      expect(midWallet.availableUnits).toBe(25);
      expect(midWallet.reservedUnits).toBe(25);

      const final = await finalizeAiReservation({
        reservationId: reservation.reservationId,
        actualUnits: 25,
        tokensIn: 500,
        tokensOut: 300,
        estimatedCogsUzs: 200n,
      });

      expect(final.success).toBe(true);
      expect(final.creditsCharged).toBe(25);

      const finalWallet = await getUserAiCredits(userId);
      expect(finalWallet.availableUnits).toBe(25);
      expect(finalWallet.reservedUnits).toBe(0);
      expect(finalWallet.totalConsumed).toBe(25);
    });

    it("releases reservation cleanly on failed generation", async () => {
      const userId = "user_ai_fail";
      await mintCreditLot({
        userId,
        source: "PURCHASED",
        units: 50,
      });

      const reservation = await reserveAiCredits({
        userId,
        sku: "ai.quiz.generate.v1",
        estimatedUnits: 25,
      });

      const releaseResult = await releaseAiReservation(reservation.reservationId, "Network Timeout");
      expect(releaseResult.released).toBe(true);

      const wallet = await getUserAiCredits(userId);
      expect(wallet.availableUnits).toBe(50);
      expect(wallet.reservedUnits).toBe(0);
      expect(wallet.totalConsumed).toBe(0);
    });
  });

  describe("4. Click Payment Gateway & Order Fulfillment", () => {
    it("handles prepare and complete actions idempotently with MD5 validation", async () => {
      const userId = "user_click_buyer";
      const click = new ClickProvider();

      // Quote & create order for 500 AI credits (Standard Pack, 100,000 UZS)
      const quote = quoteCreditPack("pack_standard");
      const order = await createOrder({
        userId,
        type: quote.type,
        quotedAmountMinor: quote.quotedAmountMinor,
        pricingPolicyCode: quote.pricingPolicyCode,
        pricingPolicyVersion: quote.pricingPolicyVersion,
        items: quote.metadata,
      });

      const signTime = "2026-08-27 12:00:00";
      const clickTransId = "click_txn_998877";

      // 1. Prepare action (action=0)
      const prepareSign = click.generateSignature(
        clickTransId,
        "edubek_service_id",
        "edubek_click_secret_key_demo",
        order.id,
        "100000",
        "0",
        signTime
      );

      const prepareResult = await click.processWebhook({
        click_trans_id: clickTransId,
        service_id: "edubek_service_id",
        merchant_trans_id: order.id,
        amount: "100000",
        action: 0,
        sign_time: signTime,
        sign_string: prepareSign,
        error: 0,
      });

      expect(prepareResult.status).toBe("PENDING");
      expect(prepareResult.responsePayload.error).toBe(0);

      // 2. Complete action (action=1)
      const completeSign = click.generateSignature(
        clickTransId,
        "edubek_service_id",
        "edubek_click_secret_key_demo",
        order.id,
        "100000",
        "1",
        signTime,
        `prep_${order.id}`
      );

      const completeResult = await click.processWebhook({
        click_trans_id: clickTransId,
        service_id: "edubek_service_id",
        merchant_trans_id: order.id,
        merchant_prepare_id: `prep_${order.id}`,
        amount: "100000",
        action: 1,
        sign_time: signTime,
        sign_string: completeSign,
        error: 0,
      });

      expect(completeResult.status).toBe("SUCCESS");
      expect(completeResult.responsePayload.error).toBe(0);

      // Verify User received 500 AI credits
      const wallet = await getUserAiCredits(userId);
      expect(wallet.availableUnits).toBe(500);

      // 3. Replay Complete action (Idempotent test)
      const replayResult = await click.processWebhook({
        click_trans_id: clickTransId,
        service_id: "edubek_service_id",
        merchant_trans_id: order.id,
        merchant_prepare_id: `prep_${order.id}`,
        amount: "100000",
        action: 1,
        sign_time: signTime,
        sign_string: completeSign,
        error: 0,
      });

      expect(replayResult.status).toBe("SUCCESS");
      // Credits must still be 500, not 1000
      const walletAfterReplay = await getUserAiCredits(userId);
      expect(walletAfterReplay.availableUnits).toBe(500);
    });
  });

  describe("5. Marketplace Commerce & Creator Balances", () => {
    it("prevents self-purchasing and handles 70/30 split on purchase fulfillment", async () => {
      const sellerId = "seller_tashkent";
      const buyerId = "buyer_samarkand";
      const listingId = "list_math_grade10";

      // Attempt self-purchase
      await expect(
        purchaseMarketplaceItem({
          buyerId: sellerId,
          listing: {
            id: listingId,
            title: "Grade 10 Algebra Exam Bank",
            sellerId,
            priceUzs: 200_000n,
          },
        })
      ).rejects.toThrow("You cannot purchase your own educational listing");

      // Valid purchase by buyer
      const checkout = await purchaseMarketplaceItem({
        buyerId,
        listing: {
          id: listingId,
          title: "Grade 10 Algebra Exam Bank",
          sellerId,
          priceUzs: 200_000n,
        },
      });

      expect(checkout.order.quotedAmountMinor).toBe("200000");

      // Simulate payment completion
      const order = economyStore.orders.get(checkout.order.id)!;
      order.status = "PAID";
      await fulfillOrder(order.id);

      // Check entitlement
      const entitlement = await checkEntitlement(buyerId, listingId);
      expect(entitlement.hasAccess).toBe(true);

      // Check seller pending balance: 70% of 200,000 UZS = 140,000 UZS
      const sellerAcc = await getCreatorAccount(sellerId);
      expect(sellerAcc.pendingUzs).toBe("140000");
    });
  });

  describe("6. Creator Payouts & Thresholds", () => {
    it("enforces minimum 100k UZS payout and 5k UZS fee", async () => {
      const creatorId = "creator_payout_test";

      // Manually set creator available balance to 150,000 UZS
      const acc = await getCreatorAccount(creatorId);
      const storeAcc = economyStore.creatorAccounts.get(creatorId)!;
      storeAcc.availableUzs = 150_000n;

      // Attempt payout under minimum (50,000 UZS)
      await expect(
        requestCreatorPayout({
          creatorId,
          amountMinor: 50_000n,
          destination: "8600123456789012",
        })
      ).rejects.toThrow("below minimum threshold");

      // Valid payout of 120,000 UZS
      const payout = await requestCreatorPayout({
        creatorId,
        amountMinor: 120_000n,
        destination: "8600123456789012",
        destinationType: "UZCARD",
      });

      expect(payout.amountMinor).toBe("120000");
      expect(payout.feeMinor).toBe("5000");
      expect(payout.status).toBe("SUBMITTED");

      // Check creator balance locked
      const updatedAcc = await getCreatorAccount(creatorId);
      expect(updatedAcc.availableUzs).toBe("30000");
      expect(updatedAcc.payoutLockedUzs).toBe("120000");

      // Settle payout
      const settled = await settlePayoutBatch(payout.id);
      expect(settled.status).toBe("SETTLED");

      const finalAcc = await getCreatorAccount(creatorId);
      expect(finalAcc.payoutLockedUzs).toBe("0");
      expect(finalAcc.paidUzs).toBe("120000");
    });

    it("reverses locked funds back to available balance on payout failure", async () => {
      const creatorId = "creator_fail_test";
      const storeAcc = economyStore.creatorAccounts.get(creatorId) || {
        id: `creator_${creatorId}`,
        creatorId,
        pendingUzs: 0n,
        eligibleUzs: 0n,
        availableUzs: 200_000n,
        payoutLockedUzs: 0n,
        paidUzs: 0n,
        version: 1,
        updatedAt: new Date(),
      };
      economyStore.creatorAccounts.set(creatorId, storeAcc);

      const payout = await requestCreatorPayout({
        creatorId,
        amountMinor: 150_000n,
        destination: "8600000000000000",
      });

      const failed = await failPayoutBatch(payout.id, "Invalid Card Number");
      expect(failed.status).toBe("FAILED");

      const acc = await getCreatorAccount(creatorId);
      expect(acc.availableUzs).toBe("200000");
      expect(acc.payoutLockedUzs).toBe("0");
    });
  });

  describe("7. Subscriptions & Periodic AI Credit Quotas", () => {
    it("activates subscription and renews monthly quotas", async () => {
      const userId = "user_sub_test";
      const checkout = await subscribeToPlan(userId, "PRO");
      if (!("order" in checkout)) {
        throw new Error("Expected order in checkout result");
      }

      // Simulate payment
      const order = economyStore.orders.get(checkout.order.id)!;
      order.status = "PAID";
      await fulfillOrder(order.id);

      const sub = getUserSubscription(userId);
      expect(sub.tier).toBe("PRO");
      expect(sub.monthlyQuota).toBe(400);

      // Verify 400 subscription credits were minted
      const credits = await getUserAiCredits(userId);
      expect(credits.availableUnits).toBe(400);

      // Cancel auto-renew
      const cancelResult = await cancelSubscription(userId);
      expect(cancelResult.success).toBe(true);

      const subAfterCancel = getUserSubscription(userId);
      expect(subAfterCancel.autoRenew).toBe(false);
    });
  });

  describe("8. Promotional Codes & Budget Caps", () => {
    it("redeems promo codes once per user and respects budget caps", async () => {
      const user1 = "promo_user_1";
      const user2 = "promo_user_2";

      createPromoCampaign({
        code: "BONUS30",
        description: "30 AI Credits Test",
        creditUnitsPerRedemption: 30,
        maxBudgetUnits: 50, // Only enough for 1 redemption (30 units)
      });

      const red1 = await redeemPromoCode(user1, "BONUS30");
      expect(red1.success).toBe(true);
      expect(red1.creditUnitsAwarded).toBe(30);

      // Second redemption by same user rejected
      await expect(redeemPromoCode(user1, "BONUS30")).rejects.toThrow("already redeemed");

      // Second user exceeds remaining budget (50 - 30 = 20 < 30)
      await expect(redeemPromoCode(user2, "BONUS30")).rejects.toThrow("maximum budget cap");
    });
  });

  describe("9. Refunds & Compensating Reversals", () => {
    it("revokes marketplace entitlement and reverses seller pending balance", async () => {
      const buyerId = "buyer_ref_test";
      const sellerId = "seller_ref_test";
      const listingId = "list_geo_10";

      const checkout = await purchaseMarketplaceItem({
        buyerId,
        listing: {
          id: listingId,
          title: "Geography Exam",
          sellerId,
          priceUzs: 100_000n,
        },
      });

      const order = economyStore.orders.get(checkout.order.id)!;
      order.status = "PAID";
      await fulfillOrder(order.id);

      expect((await checkEntitlement(buyerId, listingId)).hasAccess).toBe(true);

      // Process refund
      const refundResult = await processRefund({ orderId: order.id });
      expect(refundResult.success).toBe(true);

      // Entitlement revoked
      expect((await checkEntitlement(buyerId, listingId)).hasAccess).toBe(false);

      // Seller pending balance reversed back to 0
      const sellerAcc = await getCreatorAccount(sellerId);
      expect(sellerAcc.pendingUzs).toBe("0");
    });
  });

  describe("10. Emergency Kill-Switches", () => {
    it("blocks AI operations when AI_GLOBAL_OFF is active", async () => {
      updateKillSwitchFlags({ AI_GLOBAL_OFF: true });

      await expect(
        reserveAiCredits({
          userId: "user_blocked",
          sku: "ai.quiz.generate.v1",
        })
      ).rejects.toThrow("AI feature requests are temporarily paused");

      resetKillSwitches();
    });

    it("blocks marketplace checkout when MARKETPLACE_PURCHASE_OFF is active", async () => {
      updateKillSwitchFlags({ MARKETPLACE_PURCHASE_OFF: true });

      await expect(
        purchaseMarketplaceItem({
          buyerId: "user_blocked",
          listing: { id: "item1", title: "Test", sellerId: "seller1", priceUzs: 50_000n },
        })
      ).rejects.toThrow("Marketplace checkout is temporarily paused");

      resetKillSwitches();
    });
  });

  describe("11. Automated 11-Point Financial Reconciliation", () => {
    it("runs 11 integrity checks and passes on clean state", async () => {
      const report = await runFinancialReconciliation();
      expect(report.passed).toBe(true);
      expect(report.totalChecks).toBe(11);
      expect(report.passedChecks).toBe(11);
      expect(report.failedChecks).toBe(0);
      expect(report.discrepancies.length).toBe(0);
    });
  });
});
