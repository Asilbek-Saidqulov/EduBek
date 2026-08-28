/**
 * Creator Economy Feature Module
 */

import { AuthContext, requireAuth } from "./auth";
import { getCreatorAccount, requestCreatorPayout, listCreatorPayouts, maturePendingEarnings } from "./economy/creator";
import { getUserEntitlements } from "./economy/marketplace";

export async function getDashboard(ctx: AuthContext) {
  requireAuth(ctx);
  const account = await getCreatorAccount(ctx.userId);
  return {
    success: true,
    account,
    timestamp: new Date().toISOString(),
  };
}

export async function getEarnings(ctx: AuthContext) {
  requireAuth(ctx);
  const account = await getCreatorAccount(ctx.userId);
  return {
    success: true,
    data: account,
    timestamp: new Date().toISOString(),
  };
}

export async function getPayouts(ctx: AuthContext) {
  requireAuth(ctx);
  const payouts = listCreatorPayouts(ctx.userId);
  return {
    success: true,
    data: payouts,
    items: payouts,
    total: payouts.length,
    timestamp: new Date().toISOString(),
  };
}

export async function requestPayout(ctx: AuthContext, amountMinor: bigint, destination: string, destinationType?: string) {
  requireAuth(ctx);
  const payout = await requestCreatorPayout({
    creatorId: ctx.userId,
    amountMinor,
    destination,
    destinationType: destinationType as any,
  });
  return {
    success: true,
    data: payout,
    timestamp: new Date().toISOString(),
  };
}

export {
  getCreatorAccount,
  requestCreatorPayout,
  listCreatorPayouts,
  maturePendingEarnings,
};
