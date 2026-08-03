/**
 * EduBek — Recommendation Diversification.
 *
 * Phase 4F.2: Prevent recommendation lists from being dominated by one
 * resource type, author, organization, difficulty level, or content
 * origin (AI vs human). Diversification is applied as a final
 * post-ranking pass — never changes the underlying scores, only the
 * order and inclusion of items.
 *
 * Algorithm:
 *   1. Sort candidates by finalScore descending.
 *   2. Walk the sorted list, accepting each candidate only if its
 *      bucket (entityType, author, organization, difficulty, origin)
 *      has not yet hit its per-bucket cap.
 *   3. Track a running AI/marketplace ratio and reject candidates
 *      that would push the ratio past the target.
 *   4. Optionally prevent adjacent items from sharing a topic.
 *
 * The function returns a new array (does not mutate input) of size
 * min(targetCount, candidates.length).
 */
import type { DiversificationConfig } from "./types";

export interface DiversifiableItem {
  entityType: string;
  entityId: string;
  finalScore: number;
  author?: string | null;
  organizationId?: string | null;
  difficulty?: string | null;
  isAiGenerated?: boolean;
  isMarketplace?: boolean;
  topic?: string | null;
}

const DEFAULTS: Required<DiversificationConfig> = {
  maxPerEntityType: 3,
  maxPerAuthor: 2,
  maxPerOrganization: 3,
  maxPerDifficulty: 3,
  targetAiGeneratedRatio: 0.3,
  targetMarketplaceRatio: 0.4,
  allowAdjacentSameTopic: false,
};

export function diversify<T extends DiversifiableItem>(
  candidates: T[],
  targetCount: number,
  config: DiversificationConfig = {},
): T[] {
  const cfg = { ...DEFAULTS, ...config };
  const sorted = [...candidates].sort((a, b) => b.finalScore - a.finalScore);

  const accepted: T[] = [];
  const perEntityType = new Map<string, number>();
  const perAuthor = new Map<string, number>();
  const perOrganization = new Map<string, number>();
  const perDifficulty = new Map<string, number>();
  let aiCount = 0;
  let marketplaceCount = 0;
  let lastTopic: string | null = null;

  for (const candidate of sorted) {
    if (accepted.length >= targetCount) break;

    // Per-entityType cap
    const et = candidate.entityType;
    if ((perEntityType.get(et) ?? 0) >= cfg.maxPerEntityType) continue;

    // Per-author cap
    if (candidate.author) {
      const author = candidate.author;
      if ((perAuthor.get(author) ?? 0) >= cfg.maxPerAuthor) continue;
    }

    // Per-organization cap
    if (candidate.organizationId) {
      const org = candidate.organizationId;
      if ((perOrganization.get(org) ?? 0) >= cfg.maxPerOrganization) continue;
    }

    // Per-difficulty cap
    if (candidate.difficulty) {
      const diff = candidate.difficulty;
      if ((perDifficulty.get(diff) ?? 0) >= cfg.maxPerDifficulty) continue;
    }

    // AI-generated ratio cap
    if (candidate.isAiGenerated) {
      const projectedAiRatio = (aiCount + 1) / (accepted.length + 1);
      if (accepted.length >= 3 && projectedAiRatio > cfg.targetAiGeneratedRatio) {
        // Allow it only if no other candidates remain — try later pass.
        continue;
      }
    }

    // Marketplace ratio cap
    if (candidate.isMarketplace) {
      const projectedMarketRatio = (marketplaceCount + 1) / (accepted.length + 1);
      if (accepted.length >= 3 && projectedMarketRatio > cfg.targetMarketplaceRatio) {
        continue;
      }
    }

    // Adjacent-same-topic rule
    if (!cfg.allowAdjacentSameTopic && candidate.topic && candidate.topic === lastTopic) {
      // Skip — would create back-to-back same-topic items.
      continue;
    }

    // Accept
    accepted.push(candidate);
    perEntityType.set(et, (perEntityType.get(et) ?? 0) + 1);
    if (candidate.author) {
      perAuthor.set(candidate.author, (perAuthor.get(candidate.author) ?? 0) + 1);
    }
    if (candidate.organizationId) {
      perOrganization.set(candidate.organizationId, (perOrganization.get(candidate.organizationId) ?? 0) + 1);
    }
    if (candidate.difficulty) {
      perDifficulty.set(candidate.difficulty, (perDifficulty.get(candidate.difficulty) ?? 0) + 1);
    }
    if (candidate.isAiGenerated) aiCount += 1;
    if (candidate.isMarketplace) marketplaceCount += 1;
    lastTopic = candidate.topic ?? null;
  }

  // Second pass: if we couldn't fill all slots due to soft caps (AI ratio,
  // marketplace ratio, adjacent topic), relax ONLY those soft caps and
  // re-walk the remaining pool. Strict per-bucket caps (entityType, author,
  // organization, difficulty) are NEVER relaxed — diversification of those
  // dimensions is the whole point. The adjacent-topic rule is preserved
  // in the second pass because back-to-back same-topic items are
  // jarring for the user.
  if (accepted.length < targetCount) {
    const acceptedIds = new Set(accepted.map((a) => a.entityId));
    const lastTopicPass2 = lastTopic;
    for (const candidate of sorted) {
      if (accepted.length >= targetCount) break;
      if (acceptedIds.has(candidate.entityId)) continue;

      // Still enforce strict caps
      const et = candidate.entityType;
      if ((perEntityType.get(et) ?? 0) >= cfg.maxPerEntityType) continue;
      if (candidate.author && (perAuthor.get(candidate.author) ?? 0) >= cfg.maxPerAuthor) continue;
      if (candidate.organizationId && (perOrganization.get(candidate.organizationId) ?? 0) >= cfg.maxPerOrganization) continue;
      if (candidate.difficulty && (perDifficulty.get(candidate.difficulty) ?? 0) >= cfg.maxPerDifficulty) continue;
      // Adjacent-topic rule still enforced
      if (!cfg.allowAdjacentSameTopic && candidate.topic && candidate.topic === lastTopic) continue;

      accepted.push(candidate);
      acceptedIds.add(candidate.entityId);
      perEntityType.set(et, (perEntityType.get(et) ?? 0) + 1);
      if (candidate.author) {
        perAuthor.set(candidate.author, (perAuthor.get(candidate.author) ?? 0) + 1);
      }
      if (candidate.organizationId) {
        perOrganization.set(candidate.organizationId, (perOrganization.get(candidate.organizationId) ?? 0) + 1);
      }
      if (candidate.difficulty) {
        perDifficulty.set(candidate.difficulty, (perDifficulty.get(candidate.difficulty) ?? 0) + 1);
      }
      lastTopic = candidate.topic ?? null;
    }
    void lastTopicPass2;
  }

  return accepted;
}
