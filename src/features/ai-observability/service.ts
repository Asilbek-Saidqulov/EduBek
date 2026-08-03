/**
 * EduBek — AI Observability service.
 * Phase 6B.2: Composes every observability subsystem into a unified API.
 */
import { generateTracingReport } from "./request-tracing";
import { generateLatencyReport } from "./latency-analytics";
import { generateTokenReport } from "./token-analytics";
import { generateCostReport } from "./cost-analytics";
import { generateRoutingReport } from "./routing-analytics";
import { createExperiment, getExperiment, listExperiments, completeExperiment, generateExperimentReport } from "./experiment-engine";
import { generateDriftReport } from "./drift-monitor";
import { generateAnomalyReport } from "./anomaly-detector";
import { generateOptimizationReport } from "./optimization-engine";
import { generateForecastReport } from "./forecasting";
import { generateDashboard } from "./dashboard";
import { generateAlerts, listAlerts, acknowledgeAlert, resolveAlert } from "./alert-manager";

export {
  generateTracingReport,
  generateLatencyReport,
  generateTokenReport,
  generateCostReport,
  generateRoutingReport,
  createExperiment, getExperiment, listExperiments, completeExperiment, generateExperimentReport,
  generateDriftReport,
  generateAnomalyReport,
  generateOptimizationReport,
  generateForecastReport,
  generateDashboard,
  generateAlerts, listAlerts, acknowledgeAlert, resolveAlert,
};
