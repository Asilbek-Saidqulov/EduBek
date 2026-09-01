import { AI_SKUS } from "./constants";
import { assertAiEnabled } from "./kill-switches";

export function assertSkuCaps(sku: string, input: { chars?: number; tokens?: number; model?: string }) {
  assertAiEnabled();
  const def = AI_SKUS[sku];
  if (!def) throw new Error(`UNKNOWN_SKU:${sku}`);
  if (input.chars && def.maxInputTokens && input.chars > def.maxInputTokens * 4) {
    throw new Error("SKU_INPUT_TOO_LARGE");
  }
  if (input.tokens && def.maxInputTokens && input.tokens > def.maxInputTokens) {
    throw new Error("SKU_INPUT_TOO_LARGE");
  }
  if (input.model && def.modelAllowlist?.length && !def.modelAllowlist.includes(input.model)) {
    throw new Error("SKU_MODEL_NOT_ALLOWED");
  }
  return def;
}
