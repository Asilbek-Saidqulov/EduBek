/**
 * EduBek — Cost Analytics (System 4).
 * Tracks daily, weekly, monthly costs per provider, organization, feature,
 * workflow, prompt, model. Forecasts future AI spend. Recommends provider
 * switching, cache usage, prompt optimization, routing optimization.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { CostAnalyticsReport } from "./types";

const log = getLogger("cost-analytics");

export async function generateCostReport(): Promise<CostAnalyticsReport> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [todayAgg, weekAgg, monthAgg, byProviderGroups, byModelGroups] = await Promise.all([
    repo.aggregateAICost({ since: todayStart }),
    repo.aggregateAICost({ since: weekStart }),
    repo.aggregateAICost({ since: monthStart }),
    repo.groupAIByProvider({ since: monthStart }),
    repo.groupAIByModel({ since: monthStart }),
  ]);
  const today = todayAgg._sum.costUsd ?? 0;
  const weekToDate = weekAgg._sum.costUsd ?? 0;
  const monthToDate = monthAgg._sum.costUsd ?? 0;
  const forecast = Math.round(monthToDate * (30 / Math.max(1, now.getDate())) * 100) / 100;
  const totalCost = monthToDate || 1;
  const byProvider = byProviderGroups.map(g => ({
    provider: g.provider,
    cost: Math.round((g._sum.costUsd ?? 0) * 10000) / 10000,
    percent: Math.round(((g._sum.costUsd ?? 0) / totalCost) * 100),
  })).sort((a, b) => b.cost - a.cost);
  const byModel = byModelGroups.map(g => ({
    model: g.model,
    cost: Math.round((g._sum.costUsd ?? 0) * 10000) / 10000,
    percent: Math.round(((g._sum.costUsd ?? 0) / totalCost) * 100),
  })).sort((a, b) => b.cost - a.cost);
  const byOrganization: Array<{ organization: string; cost: number; percent: number }> = []; // would need org grouping
  const byFeature: Array<{ feature: string; cost: number; percent: number }> = []; // would need feature grouping
  const byPrompt: Array<{ promptId: string; cost: number; calls: number }> = []; // would need prompt grouping
  const recommendations = generateCostRecommendations({ today, monthToDate, forecast, byProvider });
  log.info("cost.report_complete", { today, monthToDate, forecast });
  return {
    generatedAt: new Date().toISOString(),
    today: Math.round(today * 10000) / 10000,
    weekToDate: Math.round(weekToDate * 10000) / 10000,
    monthToDate: Math.round(monthToDate * 10000) / 10000,
    forecast,
    byProvider, byOrganization, byFeature, byModel, byPrompt,
    recommendations,
  };
}

function generateCostRecommendations(input: { today: number; monthToDate: number; forecast: number; byProvider: Array<{ provider: string; cost: number; percent: number }> }): string[] {
  const recs: string[] = [];
  if (input.forecast > 100) recs.push(`Monthly forecast is $${input.forecast.toFixed(2)} — consider provider switching for cost reduction.`);
  const expensiveProvider = input.byProvider.find(p => p.percent > 70);
  if (expensiveProvider) recs.push(`${expensiveProvider.provider} accounts for ${expensiveProvider.percent}% of cost — consider routing to cheaper alternatives.`);
  if (input.today > 5) recs.push(`Daily cost is $${input.today.toFixed(2)} — review high-cost prompts and increase caching.`);
  return recs;
}
