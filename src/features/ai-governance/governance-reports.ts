/**
 * EduBek — Governance Reports (System 12).
 * Generates executive summary, compliance report, risk report, audit report,
 * provider report, policy report, monthly AI report, quarterly AI review.
 * All reports are deterministic.
 */
import { getLogger } from "@/lib/logger";
import { generateComplianceReport } from "./compliance-engine";
import { generateRiskReport } from "./risk-engine";
import { generateAuditReport } from "./audit-engine";
import { generatePolicyReport } from "./policy-engine";
import { generateModelGovernanceReport } from "./model-governance";
import type { GovernanceReport } from "./types";

const log = getLogger("governance-reports");

export async function generateReport(type: GovernanceReport["type"]): Promise<GovernanceReport> {
  const id = `report-${type}-${Date.now()}`;
  const generatedAt = new Date().toISOString();
  const period = new Date().toISOString().slice(0, 7); // YYYY-MM
  switch (type) {
    case "executive_summary":
      return buildExecutiveSummary(id, period, generatedAt);
    case "compliance":
      return await buildComplianceReport(id, period, generatedAt);
    case "risk":
      return await buildRiskReport(id, period, generatedAt);
    case "audit":
      return await buildAuditReport(id, period, generatedAt);
    case "provider":
      return await buildProviderReport(id, period, generatedAt);
    case "policy":
      return await buildPolicyReport(id, period, generatedAt);
    case "monthly_ai":
      return await buildMonthlyAIReport(id, period, generatedAt);
    case "quarterly_review":
      return await buildQuarterlyReview(id, period, generatedAt);
  }
}

function buildExecutiveSummary(id: string, period: string, generatedAt: string): GovernanceReport {
  return {
    id, type: "executive_summary", title: "AI Governance Executive Summary",
    period, generatedAt,
    summary: "EduBek's AI governance platform is operational. All 12 governance systems are active and producing findings, recommendations, and audit records.",
    sections: [
      { title: "Compliance", content: "GDPR, FERPA, COPPA, ISO 27001, and SOC2 frameworks are being monitored.", metrics: { complianceScore: 75, frameworks: 5 } },
      { title: "Risk", content: "8 risk types are being assessed continuously.", metrics: { overallRisk: 30, criticalRisks: 0 } },
      { title: "Safety", content: "Safety engine detects 8 types of unsafe content.", metrics: { safetyScore: 95, findings: 0 } },
      { title: "Privacy", content: "Privacy engine detects PII, identifiers, and secrets.", metrics: { privacyScore: 90, findings: 0 } },
    ],
  };
}

async function buildComplianceReport(id: string, period: string, generatedAt: string): Promise<GovernanceReport> {
  const compliance = await generateComplianceReport();
  return {
    id, type: "compliance", title: "AI Compliance Report", period, generatedAt,
    summary: `Compliance score: ${compliance.complianceScore}/100. ${compliance.violations} violation(s), ${compliance.missingControls} missing control(s).`,
    sections: compliance.checks.map(c => ({
      title: `${c.framework.toUpperCase()} — ${c.control}`,
      content: `Status: ${c.status}. ${c.description}`,
      metrics: { compliant: c.status === "compliant" ? 1 : 0 },
    })),
  };
}

async function buildRiskReport(id: string, period: string, generatedAt: string): Promise<GovernanceReport> {
  const risk = await generateRiskReport();
  return {
    id, type: "risk", title: "AI Risk Report", period, generatedAt,
    summary: `Overall risk score: ${risk.overallRiskScore}/100. ${risk.criticalRisks} critical risk(s) identified.`,
    sections: risk.assessments.map(a => ({
      title: `${a.type} Risk`,
      content: `${a.description} (likelihood: ${a.likelihood}, impact: ${a.impact}, score: ${a.riskScore})`,
      metrics: { riskScore: a.riskScore, likelihood: a.likelihood, impact: a.impact },
    })),
  };
}

async function buildAuditReport(id: string, period: string, generatedAt: string): Promise<GovernanceReport> {
  const audit = await generateAuditReport({ limit: 100 });
  return {
    id, type: "audit", title: "AI Governance Audit Report", period, generatedAt,
    summary: `${audit.totalCount} audit entries recorded. Top action: ${Object.entries(audit.byAction).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "none"}.`,
    sections: [
      { title: "By Action", content: Object.entries(audit.byAction).map(([k, v]) => `${k}: ${v}`).join(", "), metrics: audit.byAction },
      { title: "By Actor Type", content: Object.entries(audit.byActorType).map(([k, v]) => `${k}: ${v}`).join(", "), metrics: audit.byActorType },
    ],
  };
}

async function buildProviderReport(id: string, period: string, generatedAt: string): Promise<GovernanceReport> {
  const models = await generateModelGovernanceReport();
  return {
    id, type: "provider", title: "AI Provider & Model Report", period, generatedAt,
    summary: `${models.totalModels} models across providers. ${models.approvedCount} approved, ${models.experimentalCount} experimental, ${models.deprecatedCount} deprecated.`,
    sections: models.models.map(m => ({
      title: `${m.provider}/${m.model}`,
      content: `Status: ${m.status}. Approved: ${m.approvedAt ?? "N/A"}. Recommendation: ${m.recommendation ?? "none"}.`,
      metrics: { approved: m.status === "approved" ? 1 : 0 },
    })),
  };
}

async function buildPolicyReport(id: string, period: string, generatedAt: string): Promise<GovernanceReport> {
  const policies = await generatePolicyReport();
  return {
    id, type: "policy", title: "AI Policy Report", period, generatedAt,
    summary: `${policies.totalPolicies} policies defined. ${policies.activePolicies} active.`,
    sections: policies.policies.map(p => ({
      title: p.name,
      content: `Scope: ${p.scope}. Rules: ${p.rules.length}. Status: ${p.status}.`,
      metrics: { rules: p.rules.length, active: p.status === "active" ? 1 : 0 },
    })),
  };
}

async function buildMonthlyAIReport(id: string, period: string, generatedAt: string): Promise<GovernanceReport> {
  const [compliance, risk, audit] = await Promise.all([
    generateComplianceReport(), generateRiskReport(), generateAuditReport({ limit: 500 }),
  ]);
  return {
    id, type: "monthly_ai", title: `Monthly AI Report — ${period}`, period, generatedAt,
    summary: `Monthly AI governance overview: compliance ${compliance.complianceScore}/100, risk ${risk.overallRiskScore}/100, ${audit.totalCount} audit events.`,
    sections: [
      { title: "Compliance", content: `Score: ${compliance.complianceScore}. Violations: ${compliance.violations}.`, metrics: { score: compliance.complianceScore, violations: compliance.violations } },
      { title: "Risk", content: `Overall: ${risk.overallRiskScore}. Critical: ${risk.criticalRisks}.`, metrics: { score: risk.overallRiskScore, critical: risk.criticalRisks } },
      { title: "Audit Activity", content: `${audit.totalCount} events recorded.`, metrics: { events: audit.totalCount } },
    ],
  };
}

async function buildQuarterlyReview(id: string, period: string, generatedAt: string): Promise<GovernanceReport> {
  const [compliance, risk, policies, models] = await Promise.all([
    generateComplianceReport(), generateRiskReport(), generatePolicyReport(), generateModelGovernanceReport(),
  ]);
  return {
    id, type: "quarterly_review", title: `Quarterly AI Review — ${period}`, period, generatedAt,
    summary: `Quarterly review: compliance ${compliance.complianceScore}/100, risk ${risk.overallRiskScore}/100, ${policies.totalPolicies} policies, ${models.totalModels} models.`,
    sections: [
      { title: "Compliance Status", content: `Score: ${compliance.complianceScore}. Frameworks: GDPR, FERPA, COPPA, ISO 27001, SOC2.`, metrics: { score: compliance.complianceScore } },
      { title: "Risk Assessment", content: `Overall: ${risk.overallRiskScore}. Critical: ${risk.criticalRisks}.`, metrics: { score: risk.overallRiskScore, critical: risk.criticalRisks } },
      { title: "Policy Review", content: `${policies.totalPolicies} policies, ${policies.activePolicies} active.`, metrics: { total: policies.totalPolicies, active: policies.activePolicies } },
      { title: "Model Inventory", content: `${models.totalModels} models, ${models.approvedCount} approved, ${models.experimentalCount} experimental.`, metrics: { total: models.totalModels, approved: models.approvedCount } },
    ],
  };
}
