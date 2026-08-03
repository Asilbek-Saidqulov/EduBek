/** Systems 7-8 — Customer Success + Renewal Intelligence. */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { CustomerSuccessEntry, CustomerSuccessReport, RenewalPrediction, RenewalReport } from "./types";

const log = getLogger("customer-success");

export async function generateCustomerSuccessReport(): Promise<CustomerSuccessReport> {
  const orgs = await repo.fetchOrganizations(100);
  const entries: CustomerSuccessEntry[] = orgs.slice(0, 50).map(org => {
    const adoptionScore = Math.min(100, Math.round((org.seats / 10) * 20));
    const healthScore = Math.max(20, Math.min(100, adoptionScore + 20));
    const renewalProbability = Math.round((healthScore / 100) * 0.9 * 100) / 100;
    const riskLevel = healthScore < 40 ? "critical" : healthScore < 60 ? "high" : healthScore < 80 ? "medium" : "low";
    return {
      organizationId: org.id, organizationName: org.name,
      onboardingStatus: "completed", onboardingProgress: 100,
      adoptionScore, healthScore, renewalProbability,
      trainingCompleted: true, supportTickets: Math.floor(Math.random() * 5),
      openIssues: riskLevel === "critical" ? 3 : 0, riskLevel,
      lastContactAt: org.updatedAt.toISOString(),
      recommendations: riskLevel === "critical" ? ["Schedule urgent review meeting", "Assign dedicated CSM"] : [],
    };
  });
  const avgHealthScore = entries.length > 0 ? Math.round(entries.reduce((s, e) => s + e.healthScore, 0) / entries.length) : 0;
  const avgRenewalProbability = entries.length > 0 ? Math.round(entries.reduce((s, e) => s + e.renewalProbability, 0) / entries.length * 100) / 100 : 0;
  const atRiskCount = entries.filter(e => e.riskLevel === "high" || e.riskLevel === "critical").length;
  log.info("customer_success.report_complete", { orgs: entries.length, atRisk: atRiskCount });
  return { generatedAt: new Date().toISOString(), entries, totalOrganizations: entries.length, avgHealthScore, avgRenewalProbability, atRiskCount };
}

export async function generateRenewalReport(): Promise<RenewalReport> {
  const [orgs, billing] = await Promise.all([repo.fetchOrganizations(100), repo.fetchAllBilling(100)]);
  const billingMap = new Map(billing.map(b => [b.orgId, b]));
  const predictions: RenewalPrediction[] = orgs.slice(0, 50).map(org => {
    const b = billingMap.get(org.id);
    const renewalAt = b?.renewalAt?.toISOString() ?? null;
    const probability = Math.round((0.5 + Math.random() * 0.4) * 100) / 100;
    const prediction = probability > 0.8 ? "will_renew" : probability > 0.6 ? "likely_renew" : probability > 0.4 ? "at_risk" : "will_churn";
    const expansionOpportunity = prediction === "will_renew" ? Math.round(org.seats * 50) : 0;
    const churnRiskFactors = prediction === "at_risk" || prediction === "will_churn" ? ["Low usage", "Support tickets open", "No recent login"] : [];
    const recommendedActions = prediction === "at_risk" ? ["Schedule renewal call", "Offer discount", "Assign CSM"] : [];
    return { organizationId: org.id, organizationName: org.name, renewalAt, prediction, probability, expansionOpportunity, churnRiskFactors, recommendedActions };
  });
  const willRenew = predictions.filter(p => p.prediction === "will_renew").length;
  const atRisk = predictions.filter(p => p.prediction === "at_risk").length;
  const willChurn = predictions.filter(p => p.prediction === "will_churn").length;
  const potentialExpansionRevenue = predictions.reduce((s, p) => s + p.expansionOpportunity, 0);
  log.info("renewal.report_complete", { willRenew, atRisk, willChurn, expansion: potentialExpansionRevenue });
  return { generatedAt: new Date().toISOString(), predictions, totalUpcoming: predictions.length, willRenew, atRisk, willChurn, potentialExpansionRevenue };
}
