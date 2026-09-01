/**
 * Economy V2 lock — solvency rules.
 * Client may send action_code + resource_id only. Never price, creator_id, or amount.
 */

export const PROVIDER_FEE_BPS = 200; // 2%
export const REFUND_RESERVE_BPS = 500; // 5%
export const PLATFORM_TAKE_BPS = 3000; // 30% of gross
export const MIN_PLATFORM_FEE_UZS = 1000n;
export const MIN_LIST_PRICE_UZS = 5000n;

export type ListingSplit = {
  grossUzs: bigint;
  providerFee: bigint;
  refundReserve: bigint;
  platformTake: bigint;
  creatorShare: bigint;
};

export function splitMarketplaceGross(grossUzs: bigint): ListingSplit {
  if (grossUzs < 0n) throw new Error("NEGATIVE_PRICE");
  if (grossUzs > 0n && grossUzs < MIN_LIST_PRICE_UZS) {
    throw new Error("PRICE_BELOW_FLOOR");
  }
  const providerFee = (grossUzs * BigInt(PROVIDER_FEE_BPS)) / 10000n;
  const refundReserve = (grossUzs * BigInt(REFUND_RESERVE_BPS)) / 10000n;
  let platformTake = (grossUzs * BigInt(PLATFORM_TAKE_BPS)) / 10000n;
  if (platformTake < MIN_PLATFORM_FEE_UZS && grossUzs > 0n) platformTake = MIN_PLATFORM_FEE_UZS;
  const creatorShare = grossUzs - providerFee - refundReserve - platformTake;
  if (creatorShare < 0n) throw new Error("CREATOR_SHARE_NEGATIVE");
  return { grossUzs, providerFee, refundReserve, platformTake, creatorShare };
}

export function assertNoClientPrice(body: unknown) {
  if (!body || typeof body !== "object") return;
  const banned = ["price", "priceUzs", "priceEdu", "priceEduTokens", "amount", "creatorId", "sellerId", "commission"];
  for (const key of banned) {
    if (key in (body as Record<string, unknown>)) {
      throw new Error(`CLIENT_MAY_NOT_SET_${key.toUpperCase()}`);
    }
  }
}

export const AI_CREDIT_IS_MONEY = false;
export const PUBLIC_EDU_PEG_UZS = null;
export const INTERNAL_PACKAGING_NOTE =
  "Pack prices are UZS. Credits are non-redeemable AI units. No public EDU/UZS peg.";
