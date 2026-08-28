/**
 * Payment feature bridge module
 */

import { providerRegistry } from "./economy/providers/registry";
import { initiateCheckout, handleProviderWebhook, getPaymentIntentStatus } from "./economy/payments";
import { getKillSwitchFlags, updateKillSwitchFlags } from "./economy/kill-switches";

export async function listProviders() {
  return {
    success: true,
    providers: providerRegistry.listAvailableProviders(),
    timestamp: new Date().toISOString(),
  };
}

export {
  initiateCheckout,
  handleProviderWebhook,
  getPaymentIntentStatus,
  getKillSwitchFlags,
  updateKillSwitchFlags,
};
