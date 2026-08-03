/**
 * EduBek — Marketplace Agent.
 *
 * Phase 4F.6: Owns marketplace-domain tasks:
 *   • Recommend marketplace resources
 *   • Compare generate vs buy
 *   • Identify monetization opportunities
 *
 * Composes existing services:
 *   • Phase 4F.1 Discovery Engine (search marketplace listings)
 *   • Phase 4F.2 Recommendation Engine
 *   • Phase 4F.5 Similarity Detection (find similar marketplace products)
 *   • Phase 3 Marketplace
 *   • Phase 3 Creator Economy
 */
import { getLogger } from "@/lib/logger";
import { search as discoverySearch } from "@/features/discovery";
import { findSimilarEntities } from "@/features/knowledge-intelligence";
import { storeMemory } from "./memory";
import type { AgentDefinition, AgentResponse, AgentTask, AgentType } from "./types";

const log = getLogger("marketplace-agent");

export const MARKETPLACE_AGENT_DEFINITION: AgentDefinition = {
  type: "marketplace",
  name: "Marketplace Agent",
  description: "Owns marketplace recommendations, generate-vs-buy comparison, and monetization opportunity identification.",
  capabilities: [
    { code: "recommend_resources", name: "Recommend Marketplace Resources", nameKey: "educationOs.marketplace.capability.recommend", description: "Recommend marketplace resources for a topic or standard." },
    { code: "compare_generate_vs_buy", name: "Compare Generate vs Buy", nameKey: "educationOs.marketplace.capability.compare", description: "Compare the cost / quality of AI-generating a resource vs buying one from the marketplace." },
    { code: "monetization_opportunities", name: "Monetization Opportunities", nameKey: "educationOs.marketplace.capability.monetization", description: "Identify resources that could be monetized on the marketplace." },
  ],
  collaborators: ["teacher", "student", "curriculum"],
};

export async function executeMarketplaceTask(task: AgentTask): Promise<AgentResponse> {
  const start = Date.now();
  log.info("marketplace.task_started", { task: task.code });

  try {
    let result: unknown;
    let reasoning: AgentResponse["reasoning"];

    switch (task.code) {
      case "recommend_resources": {
        const { query, subject, limit } = task.params as { query: string; subject?: string; limit?: number };
        const searchResults = await discoverySearch({
          query,
          isMarketplace: true,
          subject,
          page: 1,
          pageSize: limit ?? 10,
        });
        result = {
          recommendations: searchResults.results.map((r) => ({
            entityId: r.entityId,
            entityType: r.entityType,
            title: r.title,
            description: r.description,
            score: r.score,
            popularity: r.popularity,
            quality: r.quality,
          })),
          total: searchResults.total,
        };
        reasoning = {
          confidence: 0.85,
          reasoning: `Found ${searchResults.total} marketplace resources matching "${query}". Top ${searchResults.results.length} returned, sorted by relevance score.`,
          reasoningKey: "educationOs.marketplace.recommend.reasoning",
          sources: searchResults.results.slice(0, 3).map((r) => ({ type: "resource" as const, id: r.entityId, title: r.title, relevance: r.score })),
          affectedModules: ["discovery", "marketplace"],
          recommendedNextActions: [
            { code: "compare_generate_vs_buy", description: "Compare buying vs generating the top result", descriptionKey: "educationOs.marketplace.nextAction.compare", priority: 1 },
          ],
        };
        break;
      }
      case "compare_generate_vs_buy": {
        const { topic, qualityRequired, timeConstraintMinutes } = task.params as {
          topic: string;
          qualityRequired?: number;
          timeConstraintMinutes?: number;
        };
        // Search marketplace for existing resources on this topic
        const searchResults = await discoverySearch({
          query: topic,
          isMarketplace: true,
          page: 1,
          pageSize: 3,
        });

        const buyOption = searchResults.results[0] ? {
          type: "buy",
          resourceId: searchResults.results[0].entityId,
          title: searchResults.results[0].title,
          estimatedCost: 5, // EduTokens — placeholder
          estimatedQuality: searchResults.results[0].quality,
          estimatedTimeMinutes: 0,
          pros: ["Instant access", "Created by experienced educator", "Likely higher quality"],
          cons: ["Costs EduTokens", "May not perfectly match needs"],
        } : null;

        const generateOption = {
          type: "generate",
          estimatedCost: 10, // AI credits
          estimatedQuality: 0.6, // AI baseline
          estimatedTimeMinutes: timeConstraintMinutes ?? 5,
          pros: ["Free if you have AI credits", "Tailored to exact needs", "Customizable"],
          cons: ["Requires AI credits", "Lower initial quality", "Takes time to generate + review"],
        };

        const recommendation = !buyOption ? "generate"
          : buyOption.estimatedQuality >= (qualityRequired ?? 0.7) && buyOption.estimatedCost < generateOption.estimatedCost
            ? "buy"
            : "generate";

        result = { buyOption, generateOption, recommendation };
        reasoning = {
          confidence: 0.8,
          reasoning: `Compared buy vs generate for "${topic}". Buy option: ${buyOption ? `${buyOption.title} (${buyOption.estimatedCost} tokens, ${Math.round(buyOption.estimatedQuality * 100)}% quality)` : "no marketplace resources found"}. Generate option: ${generateOption.estimatedCost} AI credits, ${Math.round(generateOption.estimatedQuality * 100)}% quality, ${generateOption.estimatedTimeMinutes} min. Recommendation: ${recommendation}.`,
          reasoningKey: "educationOs.marketplace.compare.reasoning",
          sources: buyOption ? [{ type: "resource" as const, id: buyOption.resourceId, title: buyOption.title, relevance: buyOption.estimatedQuality }] : [],
          affectedModules: ["discovery", "marketplace", "ai-workspace"],
          recommendedNextActions: [
            { code: recommendation === "buy" ? "purchase_resource" : "ai_resource_generation", description: recommendation === "buy" ? `Buy ${buyOption?.title}` : `Generate a resource for ${topic}`, priority: 1 },
          ],
        };
        break;
      }
      case "monetization_opportunities": {
        const { ownerId, limit } = task.params as { ownerId: string; limit?: number };
        // Find the user's resources that are NOT on the marketplace yet
        const { db } = await import("@/lib/db");
        const userResources = await db.resource.findMany({
          where: { ownerId, status: "ready", mpListing: null },
          select: { id: true, title: true, subject: true, resourceType: true, updatedAt: true },
          take: limit ?? 20,
          orderBy: { updatedAt: "desc" },
        }).catch(() => []);

        const opportunities = userResources.map((r) => ({
          resourceId: r.id,
          title: r.title,
          subject: r.subject,
          resourceType: r.resourceType,
          suggestedPrice: 3, // EduTokens — placeholder
          rationale: `Resource is ready and not yet listed on the marketplace.`,
        }));

        result = { opportunities, total: opportunities.length };
        reasoning = {
          confidence: 0.75,
          reasoning: `Found ${opportunities.length} monetization opportunities — resources owned by ${ownerId} that are ready but not yet listed on the marketplace.`,
          reasoningKey: "educationOs.marketplace.monetization.reasoning",
          sources: opportunities.slice(0, 3).map((o) => ({ type: "resource" as const, id: o.resourceId, title: o.title, relevance: 0.7 })),
          affectedModules: ["marketplace", "commerce", "creator-economy"],
          recommendedNextActions: [
            { code: "create_listing", description: "Create marketplace listings for the top opportunities", priority: 1 },
          ],
        };
        break;
      }
      default:
        throw new Error(`Unknown marketplace task: ${task.code}`);
    }

    await storeMemory({
      scopeType: "system",
      scopeId: "marketplace-agent",
      type: "action",
      summary: `Marketplace agent executed task: ${task.code}`,
      payload: { task: task.code },
      importance: 0.5,
      agentType: "marketplace",
    });

    const executionMs = Date.now() - start;
    log.info("marketplace.task_completed", { task: task.code, executionMs });
    return {
      agentType: "marketplace" as AgentType,
      task: task.code,
      result,
      reasoning,
      executionMs,
      status: "completed",
    };
  } catch (err) {
    const executionMs = Date.now() - start;
    log.error("marketplace.task_failed", { task: task.code, error: (err as Error).message });
    return {
      agentType: "marketplace" as AgentType,
      task: task.code,
      result: null,
      reasoning: { confidence: 0, reasoning: `Task failed: ${(err as Error).message}`, sources: [], affectedModules: [], recommendedNextActions: [] },
      executionMs,
      status: "failed",
      error: (err as Error).message,
    };
  }
}
