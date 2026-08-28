/**
 * Promotional AI Credits & Campaign Budget Engine
 */

import { PromoCampaignDto } from "./types";
import { PROMO_EXPIRATION_DAYS } from "./constants";
import { economyStore, StoredPromoCampaign, StoredPromoRedemption } from "./store";
import { mintCreditLot } from "./lots";
import { recordJournalEntry } from "./ledger";
import { assertPromoMintingEnabled, assertWalletUnfrozen } from "./kill-switches";
import { ApiError } from "@/lib/errors";

export interface CreatePromoCampaignParams {
  code: string;
  description?: string;
  creditUnitsPerRedemption: number;
  maxBudgetUnits: number;
  maxRedemptionsPerUser?: number;
  expiresInDays?: number;
}

export function createPromoCampaign(params: CreatePromoCampaignParams): PromoCampaignDto {
  const code = params.code.trim().toUpperCase();
  if (!code) {
    throw new ApiError(400, "Campaign promo code cannot be empty", undefined, undefined, "INVALID_CODE");
  }

  if (economyStore.promoCampaigns.has(code)) {
    throw new ApiError(409, `Campaign code ${code} already exists`, undefined, undefined, "CAMPAIGN_EXISTS");
  }

  const now = new Date();
  const expiresAt = params.expiresInDays
    ? new Date(now.getTime() + params.expiresInDays * 86400000)
    : undefined;

  const campaign: StoredPromoCampaign = {
    id: `camp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    code,
    description: params.description,
    creditUnitsPerRedemption: params.creditUnitsPerRedemption,
    maxBudgetUnits: params.maxBudgetUnits,
    usedUnits: 0,
    maxRedemptionsPerUser: params.maxRedemptionsPerUser || 1,
    expiresAt,
    isActive: true,
    createdAt: now,
  };

  economyStore.promoCampaigns.set(code, campaign);

  return toCampaignDto(campaign);
}

export function listPromoCampaigns(): PromoCampaignDto[] {
  return Array.from(economyStore.promoCampaigns.values()).map(toCampaignDto);
}

/**
 * Redeems a promotional code for bonus AI credits.
 */
export async function redeemPromoCode(userId: string, rawCode: string): Promise<{
  success: boolean;
  creditUnitsAwarded: number;
  campaignCode: string;
}> {
  assertPromoMintingEnabled();
  assertWalletUnfrozen();

  const code = (rawCode || "").trim().toUpperCase();
  const campaign = economyStore.promoCampaigns.get(code);

  if (!campaign || !campaign.isActive) {
    throw new ApiError(404, "Invalid or inactive promotional code", undefined, undefined, "INVALID_PROMO_CODE");
  }

  const now = new Date();
  if (campaign.expiresAt && campaign.expiresAt < now) {
    throw new ApiError(400, "This promotional campaign has expired", undefined, undefined, "PROMO_EXPIRED");
  }

  const redemptionKey = `${campaign.id}:${userId}`;
  if (economyStore.promoRedemptions.has(redemptionKey)) {
    throw new ApiError(400, "You have already redeemed this promotional code", undefined, undefined, "ALREADY_REDEEMED");
  }

  if (campaign.usedUnits + campaign.creditUnitsPerRedemption > campaign.maxBudgetUnits) {
    throw new ApiError(400, "This promotional campaign has reached its maximum budget cap", undefined, undefined, "PROMO_BUDGET_EXHAUSTED");
  }

  const expiresAt = new Date(now.getTime() + PROMO_EXPIRATION_DAYS * 86400000);

  // Mint PROMO credit lot
  const lot = await mintCreditLot({
    userId,
    source: "PROMO",
    units: campaign.creditUnitsPerRedemption,
    campaignId: campaign.id,
    expiresAt,
  });

  // Update campaign usage
  campaign.usedUnits += campaign.creditUnitsPerRedemption;

  // Record redemption
  const redemption: StoredPromoRedemption = {
    id: `red_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    campaignId: campaign.id,
    userId,
    creditUnitsAwarded: campaign.creditUnitsPerRedemption,
    lotId: lot.id,
    redeemedAt: now,
  };
  economyStore.promoRedemptions.set(redemptionKey, redemption);

  // Record accounting journal entries:
  // DEBIT: PROMO_EXPENSE
  // CREDIT: UNEARNED_REVENUE (Credits)
  await recordJournalEntry({
    journalCode: "PROMO_REDEMPTION",
    description: `Promotional Code Redeemed: ${code} (${campaign.creditUnitsPerRedemption} Credits)`,
    referenceType: "PROMO",
    referenceId: campaign.id,
    lines: [
      {
        account: "PROMO_EXPENSE",
        subAccount: code,
        currency: "CREDIT",
        direction: "DEBIT",
        amountMinor: BigInt(campaign.creditUnitsPerRedemption),
      },
      {
        account: "UNEARNED_REVENUE",
        subAccount: userId,
        currency: "CREDIT",
        direction: "CREDIT",
        amountMinor: BigInt(campaign.creditUnitsPerRedemption),
      },
    ],
  });

  return {
    success: true,
    creditUnitsAwarded: campaign.creditUnitsPerRedemption,
    campaignCode: code,
  };
}

function toCampaignDto(camp: StoredPromoCampaign): PromoCampaignDto {
  return {
    id: camp.id,
    code: camp.code,
    description: camp.description,
    creditUnitsPerRedemption: camp.creditUnitsPerRedemption,
    maxBudgetUnits: camp.maxBudgetUnits,
    usedUnits: camp.usedUnits,
    maxRedemptionsPerUser: camp.maxRedemptionsPerUser,
    expiresAt: camp.expiresAt?.toISOString(),
    isActive: camp.isActive,
    createdAt: camp.createdAt.toISOString(),
  };
}
