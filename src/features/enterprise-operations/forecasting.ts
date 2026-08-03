/** System 13 — Business Forecasting. */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { BusinessForecast } from "./types";

const log = getLogger("business-forecasting");

export async function generateBusinessForecast(): Promise<BusinessForecast> {
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [txAgg, marketplaceAgg, aiCostAgg, totalOrgs, newOrgs, totalUsers] = await Promise.all([
    repo.aggregateTransactionRevenue(monthAgo), repo.aggregateMarketplaceRevenue(monthAgo),
    repo.fetchAIInvocationCost(monthAgo), repo.countOrganizations(),
    repo.countOrganizationsSince(monthAgo), repo.countUsers(),
  ]);
  const currentRevenue = txAgg._sum.amount ?? 0;
  const forecasts = [
    { metric: "revenue", currentValue: Math.round(currentRevenue * 100) / 100, forecastedValue: Math.round(currentRevenue * 1.15 * 100) / 100, unit: "USD", confidence: 0.75, trend: "increasing" as const, risk: "low" as const, dataPoints: [] as Array<{ date: string; value: number }> },
    { metric: "marketplace_growth", currentValue: marketplaceAgg._count ?? 0, forecastedValue: Math.round((marketplaceAgg._count ?? 0) * 1.2), unit: "purchases", confidence: 0.7, trend: "increasing" as const, risk: "low" as const, dataPoints: [] },
    { metric: "ai_costs", currentValue: Math.round((aiCostAgg._sum.costUsd ?? 0) * 100) / 100, forecastedValue: Math.round((aiCostAgg._sum.costUsd ?? 0) * 1.3 * 100) / 100, unit: "USD", confidence: 0.8, trend: "increasing" as const, risk: "medium" as const, dataPoints: [] },
    { metric: "customer_growth", currentValue: totalOrgs, forecastedValue: Math.round(totalOrgs * 1.1), unit: "organizations", confidence: 0.7, trend: "increasing" as const, risk: "low" as const, dataPoints: [] },
    { metric: "user_growth", currentValue: totalUsers, forecastedValue: Math.round(totalUsers * 1.15), unit: "users", confidence: 0.75, trend: "increasing" as const, risk: "low" as const, dataPoints: [] },
    { metric: "infrastructure_costs", currentValue: Math.round(currentRevenue * 0.3 * 100) / 100, forecastedValue: Math.round(currentRevenue * 0.35 * 100) / 100, unit: "USD", confidence: 0.65, trend: "increasing" as const, risk: "medium" as const, dataPoints: [] },
    { metric: "renewals", currentValue: totalOrgs, forecastedValue: Math.round(totalOrgs * 0.92), unit: "organizations", confidence: 0.6, trend: "stable" as const, risk: "medium" as const, dataPoints: [] },
  ];
  log.info("forecast.complete", { metrics: forecasts.length });
  return { generatedAt: new Date().toISOString(), forecasts };
}
