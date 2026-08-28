/**
 * AI Observability, COGS Tracking & Financial Telemetry
 */

import { economyStore } from "./store";

export interface AiFinancialOverview {
  totalRequests: number;
  totalTokensIn: number;
  totalTokensOut: number;
  totalEstimatedCogsUzs: string;
  totalCreditsCharged: number;
  averageLatencyMs: number;
  skuBreakdown: Record<
    string,
    {
      requests: number;
      credits: number;
      estimatedCogsUzs: string;
    }
  >;
}

export function getAiFinancialTelemetry(): AiFinancialOverview {
  let totalRequests = 0;
  let totalTokensIn = 0;
  let totalTokensOut = 0;
  let totalCogs = 0n;
  let totalCreditsCharged = 0;
  let totalDuration = 0;

  const skuBreakdown: Record<string, { requests: number; credits: number; estimatedCogsUzs: string }> = {};

  for (const usage of economyStore.aiUsages.values()) {
    if (usage.status === "FINALIZED") {
      totalRequests++;
      totalTokensIn += usage.tokensIn;
      totalTokensOut += usage.tokensOut;
      totalCogs += usage.estimatedCogsUzs;
      totalCreditsCharged += usage.creditsCharged;
      totalDuration += usage.durationMs;

      if (!skuBreakdown[usage.sku]) {
        skuBreakdown[usage.sku] = { requests: 0, credits: 0, estimatedCogsUzs: "0" };
      }

      const prev = skuBreakdown[usage.sku];
      prev.requests++;
      prev.credits += usage.creditsCharged;
      const curCogs = BigInt(prev.estimatedCogsUzs) + usage.estimatedCogsUzs;
      prev.estimatedCogsUzs = curCogs.toString();
    }
  }

  return {
    totalRequests,
    totalTokensIn,
    totalTokensOut,
    totalEstimatedCogsUzs: totalCogs.toString(),
    totalCreditsCharged,
    averageLatencyMs: totalRequests > 0 ? Math.round(totalDuration / totalRequests) : 0,
    skuBreakdown,
  };
}
