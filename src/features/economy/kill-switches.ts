/**
 * Centralized Emergency Kill-Switches and Guard Controls for EduBek Economy
 */

import { KillSwitchFlags } from "./types";
import { DEFAULT_KILL_SWITCHES } from "./constants";
import { economyStore } from "./store";
import { ApiError } from "@/lib/errors";

export function getKillSwitchFlags(): KillSwitchFlags {
  return { ...economyStore.killSwitches };
}

export function updateKillSwitchFlags(updates: Partial<KillSwitchFlags>): KillSwitchFlags {
  economyStore.killSwitches = {
    ...economyStore.killSwitches,
    ...updates,
  };
  return { ...economyStore.killSwitches };
}

export function resetKillSwitches(): void {
  economyStore.killSwitches = { ...DEFAULT_KILL_SWITCHES };
}

export function assertEconomyWritable(): void {
  if (economyStore.killSwitches.ECONOMY_READ_ONLY) {
    throw new ApiError(503, "Economy operations are temporarily in read-only maintenance mode", undefined, undefined, "ECONOMY_READ_ONLY");
  }
}

export function assertAiEnabled(): void {
  assertEconomyWritable();
  if (economyStore.killSwitches.AI_GLOBAL_OFF) {
    throw new ApiError(503, "AI feature requests are temporarily paused for platform maintenance", undefined, undefined, "AI_GLOBAL_DISABLED");
  }
}

export function assertCreditMintingEnabled(): void {
  assertEconomyWritable();
  if (economyStore.killSwitches.CREDIT_MINT_OFF) {
    throw new ApiError(503, "AI credit purchases and minting are currently paused", undefined, undefined, "CREDIT_MINTING_DISABLED");
  }
}

export function assertPromoMintingEnabled(): void {
  assertEconomyWritable();
  if (economyStore.killSwitches.PROMO_MINT_OFF) {
    throw new ApiError(503, "Promotional code redemption is currently paused", undefined, undefined, "PROMO_MINTING_DISABLED");
  }
}

export function assertMarketplacePurchasesEnabled(): void {
  assertEconomyWritable();
  if (economyStore.killSwitches.MARKETPLACE_PURCHASE_OFF) {
    throw new ApiError(503, "Marketplace checkout is temporarily paused", undefined, undefined, "MARKETPLACE_CHECKOUT_DISABLED");
  }
}

export function assertCreatorPayoutsEnabled(): void {
  assertEconomyWritable();
  if (economyStore.killSwitches.CREATOR_PAYOUT_OFF) {
    throw new ApiError(503, "Creator payouts are temporarily suspended for system audit", undefined, undefined, "CREATOR_PAYOUTS_DISABLED");
  }
}

export function assertProviderEnabled(providerCode: string): void {
  assertEconomyWritable();
  if (providerCode === "CLICK" && economyStore.killSwitches.PROVIDER_CLICK_OFF) {
    throw new ApiError(503, "Click payment gateway is temporarily disabled", undefined, undefined, "PROVIDER_CLICK_DISABLED");
  }
}

export function assertWalletUnfrozen(): void {
  assertEconomyWritable();
  if (economyStore.killSwitches.WALLET_FREEZE) {
    throw new ApiError(503, "Wallet operations are temporarily frozen for platform security", undefined, undefined, "WALLET_FROZEN");
  }
}
