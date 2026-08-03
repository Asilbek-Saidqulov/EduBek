/**
 * EduBek — Model Governance (System 10).
 * Tracks approved, deprecated, experimental, retired models. Provider
 * lifecycle, quality/latency/cost/risk history. Recommends upgrade,
 * rollback, retirement.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { ModelGovernanceEntry, ModelGovernanceReport, ModelLifecycleStatus } from "./types";

const log = getLogger("model-governance");

// Well-known model lifecycle defaults
const KNOWN_MODELS: Array<{ provider: string; model: string; status: ModelLifecycleStatus }> = [
  { provider: "zai", model: "zai-default", status: "approved" },
  { provider: "openai", model: "gpt-4o", status: "approved" },
  { provider: "openai", model: "gpt-4o-mini", status: "approved" },
  { provider: "gemini", model: "gemini-pro", status: "approved" },
  { provider: "gemini", model: "gemini-1.5-pro", status: "approved" },
  { provider: "gemini", model: "gemini-1.5-flash", status: "approved" },
  { provider: "anthropic", model: "claude-3-opus", status: "approved" },
  { provider: "anthropic", model: "claude-3-sonnet", status: "approved" },
  { provider: "anthropic", model: "claude-3-haiku", status: "approved" },
  { provider: "deepseek", model: "deepseek-coder", status: "experimental" },
  { provider: "deepseek", model: "deepseek-chat", status: "experimental" },
  { provider: "groq", model: "llama-3-70b", status: "experimental" },
  { provider: "groq", model: "llama-3-8b", status: "experimental" },
  { provider: "mistral", model: "mistral-large", status: "experimental" },
  { provider: "local", model: "local-default", status: "approved" },
];

export async function generateModelGovernanceReport(): Promise<ModelGovernanceReport> {
  // Ensure all known models are registered
  for (const m of KNOWN_MODELS) {
    await repo.upsertModel({ provider: m.provider, model: m.model, status: m.status }).catch(() => { /* best-effort */ });
  }
  const rows = await repo.listModels();
  const models: ModelGovernanceEntry[] = rows.map(row => ({
    id: row.id,
    provider: row.provider,
    model: row.model,
    status: row.status as ModelLifecycleStatus,
    approvedAt: row.approvedAt?.toISOString() ?? null,
    approvedBy: row.approvedBy,
    qualityHistory: repo.safeParse(row.qualityHistory, []),
    latencyHistory: repo.safeParse(row.latencyHistory, []),
    costHistory: repo.safeParse(row.costHistory, []),
    riskHistory: repo.safeParse(row.riskHistory, []),
    recommendation: row.recommendation as ModelGovernanceEntry["recommendation"],
  }));
  // Add models that aren't in the DB yet
  for (const m of KNOWN_MODELS) {
    if (!models.some(x => x.provider === m.provider && x.model === m.model)) {
      models.push({
        id: `${m.provider}-${m.model}`,
        provider: m.provider, model: m.model, status: m.status,
        approvedAt: m.status === "approved" ? new Date().toISOString() : null,
        approvedBy: null,
        qualityHistory: [], latencyHistory: [], costHistory: [], riskHistory: [],
        recommendation: null,
      });
    }
  }
  const approvedCount = models.filter(m => m.status === "approved").length;
  const deprecatedCount = models.filter(m => m.status === "deprecated").length;
  const experimentalCount = models.filter(m => m.status === "experimental").length;
  log.info("model_governance.report_complete", { total: models.length, approved: approvedCount, experimental: experimentalCount });
  return {
    generatedAt: new Date().toISOString(),
    models, totalModels: models.length,
    approvedCount, deprecatedCount, experimentalCount,
  };
}

export async function approveModel(provider: string, model: string, approvedBy: string): Promise<void> {
  await repo.upsertModel({ provider, model, status: "approved", approvedBy });
  log.info("model.approved", { provider, model, approvedBy });
}

export async function deprecateModel(provider: string, model: string): Promise<void> {
  await repo.upsertModel({ provider, model, status: "deprecated" });
  log.info("model.deprecated", { provider, model });
}

export async function recommendModelAction(provider: string, model: string, recommendation: "upgrade" | "rollback" | "retire" | "maintain"): Promise<void> {
  await repo.upsertModel({ provider, model, recommendation });
  log.info("model.recommendation_set", { provider, model, recommendation });
}
