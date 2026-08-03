/**
 * EduBek — Experimentation Framework.
 *
 * Phase 4F.7: A/B testing + feature flags + winner selection.
 * Supports experiment types:
 *   • ab_test         — classic A/B test
 *   • ranking         — ranking weight experiments
 *   • prompt          — AI prompt version experiments
 *   • recommendation  — recommendation strategy experiments
 *   • search          — search ranking experiments
 *   • marketplace     — marketplace ranking / pricing experiments
 *   • planner         — learning planner experiments
 *   • feature_flag    — simple feature flag with rollout %
 *
 * Assignment is deterministic per (experimentId, userId) — the same
 * user always gets the same variant. Variant selection is weighted
 * random based on the variant weights.
 *
 * Winner selection computes per-variant conversion rates + confidence
 * (using a simple z-test approximation) and marks the experiment as
 * completed with the winning variant.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type {
  ExperimentAssignmentDto,
  ExperimentResultDto,
  ExperimentVariant,
  PlatformExperimentDto,
  ExperimentType,
  ExperimentStatus,
} from "./types";

const log = getLogger("experimentation");

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function createExperiment(input: {
  name: string;
  description?: string;
  type: ExperimentType;
  variants: ExperimentVariant[];
  rolloutPct?: number;
  successMetric?: string;
  ownerId: string;
  startsAt?: Date;
  endsAt?: Date;
}): Promise<PlatformExperimentDto> {
  const row = await repo.createExperiment({
    name: input.name,
    description: input.description,
    type: input.type,
    variants: JSON.stringify(input.variants),
    rolloutPct: input.rolloutPct ?? 100,
    successMetric: input.successMetric ?? "ctr",
    status: "draft",
    ownerId: input.ownerId,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
  });
  log.info("experiment.created", { id: row.id, name: input.name, type: input.type });
  return mapExperiment(row);
}

export async function getExperiment(id: string): Promise<PlatformExperimentDto | null> {
  const row = await repo.findExperiment(id);
  return row ? mapExperiment(row) : null;
}

export async function listExperiments(input: {
  type?: ExperimentType;
  status?: ExperimentStatus;
  ownerId?: string;
  limit?: number;
}): Promise<PlatformExperimentDto[]> {
  const rows = await repo.findExperiments(input);
  return rows.map(mapExperiment);
}

export async function updateExperimentStatus(id: string, status: ExperimentStatus): Promise<PlatformExperimentDto> {
  const row = await repo.updateExperiment(id, { status });
  log.info("experiment.status_updated", { id, status });
  return mapExperiment(row);
}

// ---------------------------------------------------------------------------
// Assignment
// ---------------------------------------------------------------------------

/**
 * Assign a user to a variant. Deterministic per (experimentId, userId) —
 * the same user always gets the same variant. Returns the existing
 * assignment if one already exists.
 */
export async function assignVariant(experimentId: string, userId: string): Promise<ExperimentAssignmentDto | null> {
  // Check if already assigned
  const existing = await repo.findExperimentAssignment(experimentId, userId);
  if (existing) return mapAssignment(existing);

  // Fetch the experiment
  const experiment = await repo.findExperiment(experimentId);
  if (!experiment) return null;
  if (experiment.status !== "running") return null;

  // Check rollout % — users outside the rollout get no assignment
  const rolloutHash = hashString(`${experimentId}:${userId}`) % 100;
  if (rolloutHash >= experiment.rolloutPct) return null;

  // Weighted random variant selection
  const variants = safeParseVariants(experiment.variants);
  const selectedVariant = weightedRandom(variants);

  const assignment = await repo.createExperimentAssignment({
    experimentId,
    userId,
    variant: selectedVariant,
  });

  log.info("experiment.assigned", { experimentId, userId, variant: selectedVariant });
  return mapAssignment(assignment);
}

/**
 * Get the variant for a user (without creating an assignment).
 * Returns null if the user is not in the experiment.
 */
export async function getVariant(experimentId: string, userId: string): Promise<string | null> {
  const assignment = await repo.findExperimentAssignment(experimentId, userId);
  return assignment?.variant ?? null;
}

// ---------------------------------------------------------------------------
// Results + winner selection
// ---------------------------------------------------------------------------

export async function getExperimentResults(experimentId: string): Promise<ExperimentResultDto | null> {
  const experiment = await repo.findExperiment(experimentId);
  if (!experiment) return null;

  const assignments = await repo.findExperimentAssignments({ experimentId, limit: 10000 });

  // For each variant, count impressions + conversions
  // Conversions come from FeedbackEvent with experimentId + variant + positive outcome
  const variants = safeParseVariants(experiment.variants);
  const variantResults: ExperimentResultDto["variantResults"] = [];

  for (const variant of variants) {
    const variantAssignments = assignments.filter((a) => a.variant === variant.name);
    const impressions = variantAssignments.length;

    // Fetch conversion events for this variant
    const { db } = await import("@/lib/db");
    const conversions = await db.feedbackEvent.count({
      where: {
        experimentId,
        variant: variant.name,
        outcome: "positive",
      },
    }).catch(() => 0);

    const conversionRate = impressions > 0 ? conversions / impressions : 0;
    const confidence = computeConfidence(impressions, conversions);

    variantResults.push({
      variant: variant.name,
      impressions,
      conversions,
      conversionRate,
      confidence,
    });
  }

  // Sort by conversion rate descending
  variantResults.sort((a, b) => b.conversionRate - a.conversionRate);

  // Determine winner — needs statistical significance
  const topVariant = variantResults[0];
  const secondVariant = variantResults[1];
  let winnerVariant: string | null = null;
  let winnerConfidence = 0;
  let isStatisticallySignificant = false;

  if (topVariant && secondVariant && topVariant.impressions >= 30 && secondVariant.impressions >= 30) {
    // Simple significance check: top variant's conversion rate must be > second's
    // by at least 5 percentage points AND have higher confidence
    if (topVariant.conversionRate - secondVariant.conversionRate >= 0.05 &&
        topVariant.confidence > secondVariant.confidence) {
      winnerVariant = topVariant.variant;
      winnerConfidence = topVariant.confidence;
      isStatisticallySignificant = true;
    }
  }

  return {
    experiment: mapExperiment(experiment),
    variantResults,
    winnerVariant,
    winnerConfidence,
    isStatisticallySignificant,
  };
}

/**
 * Finalize an experiment: compute results, set winner, mark as completed.
 */
export async function finalizeExperiment(experimentId: string): Promise<ExperimentResultDto | null> {
  const results = await getExperimentResults(experimentId);
  if (!results) return null;

  let updatedExperiment = results.experiment;
  if (results.winnerVariant) {
    const row = await repo.updateExperiment(experimentId, {
      status: "completed",
      winnerVariant: results.winnerVariant,
      winnerConfidence: results.winnerConfidence,
    });
    updatedExperiment = mapExperiment(row);
    log.info("experiment.finalized", {
      experimentId,
      winner: results.winnerVariant,
      confidence: results.winnerConfidence,
    });
  } else {
    const row = await repo.updateExperiment(experimentId, { status: "completed" });
    updatedExperiment = mapExperiment(row);
    log.info("experiment.finalized_no_winner", { experimentId });
  }

  return { ...results, experiment: updatedExperiment };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function weightedRandom(variants: ExperimentVariant[]): string {
  const totalWeight = variants.reduce((s, v) => s + v.weight, 0);
  if (totalWeight === 0) return variants[0]?.name ?? "control";
  const r = Math.random() * totalWeight;
  let cumulative = 0;
  for (const v of variants) {
    cumulative += v.weight;
    if (r <= cumulative) return v.name;
  }
  return variants[variants.length - 1]!.name;
}

function computeConfidence(impressions: number, conversions: number): number {
  // Simple Wilson score interval lower bound — a conservative confidence
  // estimate that accounts for small sample sizes.
  if (impressions === 0) return 0;
  const p = conversions / impressions;
  const z = 1.96; // 95% confidence
  const denominator = 1 + (z * z) / impressions;
  const numerator = p + (z * z) / (2 * impressions) - z * Math.sqrt((p * (1 - p) + (z * z) / (4 * impressions)) / impressions);
  return Math.max(0, Math.min(1, numerator / denominator));
}

function safeParseVariants(raw: string | null): ExperimentVariant[] {
  if (!raw) return [{ name: "control", weight: 100 }];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) && arr.length > 0 ? arr : [{ name: "control", weight: 100 }];
  } catch {
    return [{ name: "control", weight: 100 }];
  }
}

function mapExperiment(row: any): PlatformExperimentDto {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    type: row.type as ExperimentType,
    variants: safeParseVariants(row.variants),
    rolloutPct: row.rolloutPct,
    successMetric: row.successMetric,
    status: row.status as ExperimentStatus,
    winnerVariant: row.winnerVariant,
    winnerConfidence: row.winnerConfidence,
    startsAt: row.startsAt?.toISOString() ?? null,
    endsAt: row.endsAt?.toISOString() ?? null,
    ownerId: row.ownerId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapAssignment(row: any): ExperimentAssignmentDto {
  return {
    id: row.id,
    experimentId: row.experimentId,
    userId: row.userId,
    variant: row.variant,
    assignedAt: row.assignedAt.toISOString(),
    firstOutcome: row.firstOutcome,
    firstOutcomeAt: row.firstOutcomeAt?.toISOString() ?? null,
  };
}
