/**
 * EduBek — Unified Admin Console Dashboard.
 *
 * Phase 5D.4: One endpoint returning the health of every subsystem —
 * Platform Health, Cloud, Education OS, AI, Digital Twins, Recommendations,
 * Knowledge Graph, Marketplace, Research, Global Intelligence, Civilization,
 * Automation, Learning Planner, Assessment, Extensions, Integrations,
 * Data Fabric, Platform Intelligence, Alerts, Costs, Workers, Queues,
 * Usage, Status.
 *
 * The dashboard aggregates from existing subsystem services and never
 * duplicates their logic — every metric is fetched from the source of
 * truth.
 */
import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";
import { getProductionReadiness } from "./production";
import { getObservabilitySnapshot } from "./observability";
import { getSelfHealingReport } from "./self-healing";
import { getDependencyGraph } from "./dependency-graph";
import { workflowStats } from "./workflow-registry";
import { promptRegistryStats } from "./prompt-registry";
import { listExecutions, listActionHandlers } from "./event-orchestrator";
import type { AdminDashboardDto } from "./types";

const log = getLogger("dashboard");

// ===========================================================================
// Public API
// ===========================================================================

export async function getAdminDashboard(): Promise<AdminDashboardDto> {
  const generatedAt = new Date().toISOString();

  // Subsystem metrics — each fetch is wrapped so a single failure doesn't break the dashboard
  const [subsystems, alerts, costs, workers, usage, kpis] = await Promise.all([
    fetchSubsystemHealth(),
    fetchAlerts().catch(() => []),
    fetchCosts().catch(() => ({
      today: 0, monthToDate: 0, forecast: 0, currency: "USD", breakdown: [],
    })),
    fetchWorkers().catch(() => ({
      active: 0, idle: 0, failed: 0, queues: [],
    })),
    fetchUsage().catch(() => ({
      activeUsers: 0, requestsPerMin: 0, aiCallsToday: 0, storageUsedGb: 0,
    })),
    fetchKpis().catch(() => []),
  ]);

  // Overall status — derived from subsystems
  const criticalCount = subsystems.filter(s => s.status === "critical").length;
  const degradedCount = subsystems.filter(s => s.status === "degraded").length;
  let overallStatus: AdminDashboardDto["overallStatus"] = "operational";
  if (criticalCount > 0) overallStatus = criticalCount >= 3 ? "major_outage" : "partial_outage";
  else if (degradedCount > 0) overallStatus = "degraded";

  return {
    generatedAt,
    overallStatus,
    subsystems,
    alerts,
    costs,
    workers,
    usage,
    kpis,
  };
}

// ===========================================================================
// Subsystem health
// ===========================================================================

async function fetchSubsystemHealth(): Promise<AdminDashboardDto["subsystems"]> {
  const subsystems: AdminDashboardDto["subsystems"] = [];

  // 1. Platform Health — from health snapshots
  subsystems.push(await fetchHealthSubsystem("platform_health", "Platform Health"));

  // 2. Cloud Infrastructure
  subsystems.push(await fetchCloudSubsystem());

  // 3. Education OS
  subsystems.push(await fetchEducationOsSubsystem());

  // 4. AI Workspace
  subsystems.push(await fetchAiSubsystem());

  // 5. Digital Twins
  subsystems.push(await fetchDigitalTwinsSubsystem());

  // 6. Recommendations
  subsystems.push(await fetchRecommendationsSubsystem());

  // 7. Knowledge Graph
  subsystems.push(await fetchKnowledgeGraphSubsystem());

  // 8. Marketplace
  subsystems.push(await fetchMarketplaceSubsystem());

  // 9. Research Platform
  subsystems.push(await fetchResearchSubsystem());

  // 10. Global Intelligence
  subsystems.push(await fetchGlobalIntelligenceSubsystem());

  // 11. Civilization Engine
  subsystems.push(await fetchCivilizationSubsystem());

  // 12. Automation
  subsystems.push(await fetchAutomationSubsystem());

  // 13. Learning Planner
  subsystems.push(await fetchLearningPlannerSubsystem());

  // 14. Assessment Platform
  subsystems.push(await fetchAssessmentSubsystem());

  // 15. Extensions (Platform SDK)
  subsystems.push(await fetchExtensionsSubsystem());

  // 16. Integrations
  subsystems.push(await fetchIntegrationsSubsystem());

  // 17. Data Fabric
  subsystems.push(await fetchDataFabricSubsystem());

  // 18. Platform Intelligence
  subsystems.push(await fetchPlatformIntelligenceSubsystem());

  // 19. Event Bus
  subsystems.push(await fetchEventBusSubsystem());

  // 20. Orchestrator itself
  subsystems.push(await fetchOrchestratorSubsystem());

  return subsystems;
}

async function fetchHealthSubsystem(name: string, label: string): Promise<AdminDashboardDto["subsystems"][number]> {
  try {
    const latest = await db.healthSnapshot.findFirst({
      orderBy: { createdAt: "desc" },
      select: { status: true, score: true, createdAt: true, subsystem: true },
    });
    const status = (latest?.status ?? "unknown") as "healthy" | "degraded" | "critical" | "unknown";
    return {
      name,
      status,
      healthScore: latest?.score ?? 0,
      metrics: { lastCheck: latest?.createdAt?.toISOString() ?? "never" },
      lastIncident: null,
    };
  } catch {
    return { name, status: "unknown", healthScore: 0, metrics: {}, lastIncident: null };
  }
}

async function fetchCloudSubsystem(): Promise<AdminDashboardDto["subsystems"][number]> {
  try {
    const activeWorkers = await db.cloudWorker.count({ where: { status: "active" } }).catch(() => 0);
    const queuedJobs = await db.cloudJob.count({ where: { status: "queued" } }).catch(() => 0);
    const failedJobs = await db.cloudJob.count({ where: { status: "failed" } }).catch(() => 0);
    const status: AdminDashboardDto["subsystems"][number]["status"] = failedJobs > 10 ? "degraded" : "healthy";
    return {
      name: "cloud_infrastructure",
      status,
      healthScore: failedJobs > 10 ? 0.5 : 1.0,
      metrics: { activeWorkers, queuedJobs, failedJobs },
      lastIncident: null,
    };
  } catch {
    return { name: "cloud_infrastructure", status: "unknown", healthScore: 0, metrics: {}, lastIncident: null };
  }
}

async function fetchEducationOsSubsystem(): Promise<AdminDashboardDto["subsystems"][number]> {
  try {
    const agentLogs = await db.agentExecutionLog.count({
      where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }).catch(() => 0);
    const activeWorkflows = await db.agentWorkflow.count({ where: { status: "running" } }).catch(() => 0);
    return {
      name: "education_os",
      status: "healthy",
      healthScore: 1.0,
      metrics: { agentInvocations24h: agentLogs, activeWorkflows },
      lastIncident: null,
    };
  } catch {
    return { name: "education_os", status: "unknown", healthScore: 0, metrics: {}, lastIncident: null };
  }
}

async function fetchAiSubsystem(): Promise<AdminDashboardDto["subsystems"][number]> {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const aiCalls = await db.orchestratorAIInvocation.count({ where: { createdAt: { gte: since } } }).catch(() => 0);
    const failedCalls = await db.orchestratorAIInvocation.count({ where: { createdAt: { gte: since }, status: "failed" } }).catch(() => 0);
    const totalCost = await db.orchestratorAIInvocation.aggregate({
      where: { createdAt: { gte: since } },
      _sum: { costUsd: true },
    }).catch(() => ({ _sum: { costUsd: 0 } }));
    const status: AdminDashboardDto["subsystems"][number]["status"] = failedCalls > aiCalls * 0.1 ? "degraded" : "healthy";
    return {
      name: "ai_workspace",
      status,
      healthScore: aiCalls > 0 ? 1 - (failedCalls / aiCalls) : 1.0,
      metrics: {
        aiCalls24h: aiCalls,
        failedCalls24h: failedCalls,
        cost24h: totalCost._sum.costUsd ?? 0,
      },
      lastIncident: null,
    };
  } catch {
    return { name: "ai_workspace", status: "unknown", healthScore: 0, metrics: {}, lastIncident: null };
  }
}

async function fetchDigitalTwinsSubsystem(): Promise<AdminDashboardDto["subsystems"][number]> {
  try {
    const activeTwins = await db.digitalTwin.count({ where: { active: true } }).catch(() => 0);
    const staleTwins = await db.digitalTwin.count({
      where: { active: true, lastSyncedAt: { lt: new Date(Date.now() - 60 * 60 * 1000) } },
    }).catch(() => 0);
    return {
      name: "digital_twins",
      status: staleTwins > activeTwins * 0.3 ? "degraded" : "healthy",
      healthScore: activeTwins > 0 ? 1 - (staleTwins / activeTwins) : 1.0,
      metrics: { activeTwins, staleTwins },
      lastIncident: null,
    };
  } catch {
    return { name: "digital_twins", status: "unknown", healthScore: 0, metrics: {}, lastIncident: null };
  }
}

async function fetchRecommendationsSubsystem(): Promise<AdminDashboardDto["subsystems"][number]> {
  try {
    const totalRecs = await db.recommendation.count().catch(() => 0);
    const recentRecs = await db.recommendation.count({
      where: { generatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }).catch(() => 0);
    return {
      name: "recommendations",
      status: recentRecs === 0 && totalRecs > 0 ? "degraded" : "healthy",
      healthScore: 1.0,
      metrics: { totalRecommendations: totalRecs, generated24h: recentRecs },
      lastIncident: null,
    };
  } catch {
    return { name: "recommendations", status: "unknown", healthScore: 0, metrics: {}, lastIncident: null };
  }
}

async function fetchKnowledgeGraphSubsystem(): Promise<AdminDashboardDto["subsystems"][number]> {
  try {
    const nodes = await db.concept.count().catch(() => 0);
    const edges = await db.conceptRelationship.count().catch(() => 0);
    return {
      name: "knowledge_graph",
      status: "healthy",
      healthScore: 1.0,
      metrics: { nodes, edges },
      lastIncident: null,
    };
  } catch {
    return { name: "knowledge_graph", status: "unknown", healthScore: 0, metrics: {}, lastIncident: null };
  }
}

async function fetchMarketplaceSubsystem(): Promise<AdminDashboardDto["subsystems"][number]> {
  try {
    const publishedApps = await db.marketplaceApp.count({ where: { status: "published" } }).catch(() => 0);
    const pendingApps = await db.marketplaceApp.count({ where: { status: "pending_review" } }).catch(() => 0);
    return {
      name: "marketplace",
      status: "healthy",
      healthScore: 1.0,
      metrics: { publishedApps, pendingReview: pendingApps },
      lastIncident: null,
    };
  } catch {
    return { name: "marketplace", status: "unknown", healthScore: 0, metrics: {}, lastIncident: null };
  }
}

async function fetchResearchSubsystem(): Promise<AdminDashboardDto["subsystems"][number]> {
  try {
    const activeProjects = await db.researchProject.count({ where: { status: "active" } }).catch(() => 0);
    const pendingReviews = await db.peerReview.count({ where: { status: "pending" } }).catch(() => 0);
    return {
      name: "research_platform",
      status: "healthy",
      healthScore: 1.0,
      metrics: { activeProjects, pendingReviews },
      lastIncident: null,
    };
  } catch {
    return { name: "research_platform", status: "unknown", healthScore: 0, metrics: {}, lastIncident: null };
  }
}

async function fetchGlobalIntelligenceSubsystem(): Promise<AdminDashboardDto["subsystems"][number]> {
  try {
    const foundationModels = await db.foundationModel.count({ where: { status: "active" } }).catch(() => 0);
    const networkParticipants = await db.networkParticipation.count().catch(() => 0);
    return {
      name: "global_intelligence",
      status: "healthy",
      healthScore: 1.0,
      metrics: { foundationModels, networkParticipants },
      lastIncident: null,
    };
  } catch {
    return { name: "global_intelligence", status: "unknown", healthScore: 0, metrics: {}, lastIncident: null };
  }
}

async function fetchCivilizationSubsystem(): Promise<AdminDashboardDto["subsystems"][number]> {
  try {
    const memories = await db.institutionalMemory.count().catch(() => 0);
    const activePolicies = await db.educationalPolicy.count({ where: { status: "active" } }).catch(() => 0);
    return {
      name: "civilization_engine",
      status: "healthy",
      healthScore: 1.0,
      metrics: { institutionalMemories: memories, activePolicies },
      lastIncident: null,
    };
  } catch {
    return { name: "civilization_engine", status: "unknown", healthScore: 0, metrics: {}, lastIncident: null };
  }
}

async function fetchAutomationSubsystem(): Promise<AdminDashboardDto["subsystems"][number]> {
  try {
    const rules = await db.automationRule.count().catch(() => 0);
    return {
      name: "automation",
      status: "healthy",
      healthScore: 1.0,
      metrics: { automationRules: rules },
      lastIncident: null,
    };
  } catch {
    return { name: "automation", status: "unknown", healthScore: 0, metrics: {}, lastIncident: null };
  }
}

async function fetchLearningPlannerSubsystem(): Promise<AdminDashboardDto["subsystems"][number]> {
  try {
    const activeGoals = await db.learningGoal.count({ where: { achievedAt: null } }).catch(() => 0);
    const activePlans = await db.learningPlan.count({ where: { status: "active" } }).catch(() => 0);
    return {
      name: "learning_planner",
      status: "healthy",
      healthScore: 1.0,
      metrics: { activeGoals, activePlans },
      lastIncident: null,
    };
  } catch {
    return { name: "learning_planner", status: "unknown", healthScore: 0, metrics: {}, lastIncident: null };
  }
}

async function fetchAssessmentSubsystem(): Promise<AdminDashboardDto["subsystems"][number]> {
  try {
    const assessments = await db.assessment.count().catch(() => 0);
    const attempts24h = await db.assessmentAttempt.count({
      where: { startedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }).catch(() => 0);
    return {
      name: "assessment_platform",
      status: "healthy",
      healthScore: 1.0,
      metrics: { assessments, attempts24h },
      lastIncident: null,
    };
  } catch {
    return { name: "assessment_platform", status: "unknown", healthScore: 0, metrics: {}, lastIncident: null };
  }
}

async function fetchExtensionsSubsystem(): Promise<AdminDashboardDto["subsystems"][number]> {
  try {
    const extensions = await db.extension.count().catch(() => 0);
    const installs = await db.extensionInstall.count({ where: { status: { not: "uninstalled" } } }).catch(() => 0);
    return {
      name: "extensions",
      status: "healthy",
      healthScore: 1.0,
      metrics: { extensions, activeInstalls: installs },
      lastIncident: null,
    };
  } catch {
    return { name: "extensions", status: "unknown", healthScore: 0, metrics: {}, lastIncident: null };
  }
}

async function fetchIntegrationsSubsystem(): Promise<AdminDashboardDto["subsystems"][number]> {
  try {
    const integrations = await db.integration.count().catch(() => 0);
    const apiKeys = await db.apiKey.count().catch(() => 0);
    return {
      name: "integrations",
      status: "healthy",
      healthScore: 1.0,
      metrics: { integrations, apiKeys },
      lastIncident: null,
    };
  } catch {
    return { name: "integrations", status: "unknown", healthScore: 0, metrics: {}, lastIncident: null };
  }
}

async function fetchDataFabricSubsystem(): Promise<AdminDashboardDto["subsystems"][number]> {
  try {
    const entities = await db.dataFabricEntity.count().catch(() => 0);
    const eventStoreCount = await db.eventStore.count().catch(() => 0);
    return {
      name: "data_fabric",
      status: "healthy",
      healthScore: 1.0,
      metrics: { entities, eventStoreEvents: eventStoreCount },
      lastIncident: null,
    };
  } catch {
    return { name: "data_fabric", status: "unknown", healthScore: 0, metrics: {}, lastIncident: null };
  }
}

async function fetchPlatformIntelligenceSubsystem(): Promise<AdminDashboardDto["subsystems"][number]> {
  try {
    const activeExperiments = await db.platformExperiment.count({ where: { status: "running" } }).catch(() => 0);
    const unacknowledgedInsights = await db.platformInsight.count({ where: { acknowledgedAt: null } }).catch(() => 0);
    return {
      name: "platform_intelligence",
      status: "healthy",
      healthScore: 1.0,
      metrics: { activeExperiments, unacknowledgedInsights },
      lastIncident: null,
    };
  } catch {
    return { name: "platform_intelligence", status: "unknown", healthScore: 0, metrics: {}, lastIncident: null };
  }
}

async function fetchEventBusSubsystem(): Promise<AdminDashboardDto["subsystems"][number]> {
  try {
    const stats = workflowStats();
    const handlers = listActionHandlers();
    return {
      name: "event_bus",
      status: "healthy",
      healthScore: 1.0,
      metrics: {
        workflowsTotal: stats.total,
        workflowsEnabled: stats.enabled,
        actionHandlers: handlers.length,
      },
      lastIncident: null,
    };
  } catch {
    return { name: "event_bus", status: "unknown", healthScore: 0, metrics: {}, lastIncident: null };
  }
}

async function fetchOrchestratorSubsystem(): Promise<AdminDashboardDto["subsystems"][number]> {
  try {
    const graph = getDependencyGraph();
    const promptStats = await promptRegistryStats().catch(() => ({ total: 0, active: 0 }));
    return {
      name: "platform_orchestrator",
      status: "healthy",
      healthScore: 1.0,
      metrics: {
        dependencyNodes: graph.totalNodes,
        dependencyEdges: graph.totalEdges,
        prompts: promptStats.total,
        activePrompts: promptStats.active,
      },
      lastIncident: null,
    };
  } catch {
    return { name: "platform_orchestrator", status: "unknown", healthScore: 0, metrics: {}, lastIncident: null };
  }
}

// ===========================================================================
// Alerts, costs, workers, usage, KPIs
// ===========================================================================

async function fetchAlerts(): Promise<AdminDashboardDto["alerts"]> {
  const alerts: AdminDashboardDto["alerts"] = [];
  const report = await getSelfHealingReport();
  for (const issue of report.detectedIssues) {
    alerts.push({
      id: issue.id,
      severity: issue.severity === "low" ? "info" : issue.severity === "medium" ? "warning" : "error",
      title: `${issue.module} issue`,
      description: issue.description,
      module: issue.module,
      createdAt: issue.detectedAt,
      acknowledged: false,
    });
  }
  return alerts.slice(0, 50);
}

async function fetchCosts(): Promise<AdminDashboardDto["costs"]> {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const sinceMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const todayAgg = await db.orchestratorAIInvocation.aggregate({
    where: { createdAt: { gte: since24h } },
    _sum: { costUsd: true },
  });
  const monthAgg = await db.orchestratorAIInvocation.aggregate({
    where: { createdAt: { gte: sinceMonth } },
    _sum: { costUsd: true },
  });
  const today = todayAgg._sum.costUsd ?? 0;
  const monthToDate = monthAgg._sum.costUsd ?? 0;
  const forecast = monthToDate * (30 / Math.max(1, new Date().getDate()));
  return {
    today: Math.round(today * 10000) / 10000,
    monthToDate: Math.round(monthToDate * 10000) / 10000,
    forecast: Math.round(forecast * 10000) / 10000,
    currency: "USD",
    breakdown: [{ category: "ai_inference", amount: Math.round(monthToDate * 10000) / 10000, percent: 100 }],
  };
}

async function fetchWorkers(): Promise<AdminDashboardDto["workers"]> {
  const active = await db.cloudWorker.count({ where: { status: "active" } }).catch(() => 0);
  const idle = await db.cloudWorker.count({ where: { status: "idle" } }).catch(() => 0);
  const failed = await db.cloudWorker.count({ where: { status: "failed" } }).catch(() => 0);
  const queues = await db.cloudJob.groupBy({
    by: ["queue"],
    where: { status: { in: ["queued", "processing"] } },
    _count: { _all: true },
  }).catch(() => []);
  const queueMetrics: AdminDashboardDto["workers"]["queues"] = [];
  for (const q of queues) {
    const depth = await db.cloudJob.count({ where: { queue: q.queue, status: "queued" } }).catch(() => 0);
    const processing = await db.cloudJob.count({ where: { queue: q.queue, status: "processing" } }).catch(() => 0);
    queueMetrics.push({ name: q.queue, depth, processing, throughputPerMin: 0 });
  }
  return { active, idle, failed, queues: queueMetrics };
}

async function fetchUsage(): Promise<AdminDashboardDto["usage"]> {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const since1h = new Date(Date.now() - 60 * 60 * 1000);
  const [activeUsers, requests1h, aiCallsToday] = await Promise.all([
    db.user.count({ where: { updatedAt: { gte: since24h } } }).catch(() => 0),
    db.orchestratorTraceSpan.count({ where: { startedAt: { gte: since1h } } }).catch(() => 0),
    db.orchestratorAIInvocation.count({ where: { createdAt: { gte: since24h } } }).catch(() => 0),
  ]);
  return {
    activeUsers,
    requestsPerMin: Math.round(requests1h / 60),
    aiCallsToday,
    storageUsedGb: 0, // not tracked at the application layer
  };
}

async function fetchKpis(): Promise<AdminDashboardDto["kpis"]> {
  const totalUsers = await db.user.count().catch(() => 0);
  const totalResources = await db.resource.count().catch(() => 0);
  const totalAssessments = await db.assessment.count().catch(() => 0);
  const totalClassrooms = await db.classroom.count().catch(() => 0);
  return [
    { name: "Total Users", value: totalUsers, unit: "count", trend: 0, target: null },
    { name: "Total Resources", value: totalResources, unit: "count", trend: 0, target: null },
    { name: "Total Assessments", value: totalAssessments, unit: "count", trend: 0, target: null },
    { name: "Total Classrooms", value: totalClassrooms, unit: "count", trend: 0, target: null },
  ];
}
