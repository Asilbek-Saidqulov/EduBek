/**
 * System 1 — Workflow Builder + System 2 — Trigger Engine + System 3 — Condition Engine.
 * Deterministic. No LLM calls.
 */
import { randomUUID } from "node:crypto";
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { WorkflowDefinition, WorkflowNode, WorkflowBuilderReport, TriggerDefinition, TriggerEngineReport, ConditionRule, ConditionGroup, ConditionEvaluationResult, ConditionOperator, LogicalOperator, NodeType } from "./types";

const log = getLogger("workflow-automation");

// ===========================================================================
// System 1 — Workflow Builder
// ===========================================================================

export function createWorkflow(input: {
  name: string; description: string;
  nodes?: WorkflowNode[]; variables?: Array<{ name: string; type: string; defaultValue: string }>;
  simulationMode?: boolean; requiresApproval?: boolean;
}): WorkflowDefinition {
  return {
    id: randomUUID(), name: input.name, description: input.description,
    version: 1, status: "draft",
    nodes: input.nodes ?? [{ id: "start", type: "trigger" as NodeType, label: "Start", config: {}, next: [] }],
    variables: input.variables ?? [],
    subflows: [], simulationMode: input.simulationMode ?? true,
    requiresApproval: input.requiresApproval ?? true,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
}

export function validateWorkflow(wf: WorkflowDefinition): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!wf.name) errors.push("Workflow name is required");
  if (wf.nodes.length === 0) errors.push("Workflow must have at least one node");
  const hasTrigger = wf.nodes.some(n => n.type === "trigger");
  if (!hasTrigger) errors.push("Workflow must have a trigger node");
  const hasEnd = wf.nodes.some(n => n.type === "end" || n.next.length === 0);
  if (!hasEnd) errors.push("Workflow must have an end node");
  // Check for cycles (simplified — just check node count)
  if (wf.nodes.length > 100) errors.push("Workflow has too many nodes (max 100)");
  return { valid: errors.length === 0, errors };
}

export async function generateBuilderReport(): Promise<WorkflowBuilderReport> {
  const [agentWfs, autoRules] = await Promise.all([repo.fetchAgentWorkflows(200), repo.fetchAutomationRules(200)]);
  const workflows: WorkflowDefinition[] = [];
  // Convert agent workflows
  for (const aw of agentWfs) {
    workflows.push({
      id: aw.id, name: `Agent Workflow ${aw.type}`, description: `Type: ${aw.type}`,
      version: 1, status: aw.status === "completed" ? "active" : "draft",
      nodes: [{ id: "trigger", type: "trigger", label: "Trigger", config: { type: aw.type }, next: [] }],
      variables: [], subflows: [], simulationMode: false, requiresApproval: true,
      createdAt: aw.createdAt.toISOString(), updatedAt: aw.updatedAt.toISOString(),
    });
  }
  // Convert automation rules
  for (const rule of autoRules) {
    workflows.push({
      id: rule.id, name: rule.name, description: `Trigger: ${rule.trigger}`,
      version: 1, status: rule.enabled ? "active" : "paused",
      nodes: [
        { id: "trigger", type: "trigger", label: rule.trigger, config: {}, next: ["action"] },
        { id: "action", type: "action", label: "Execute actions", config: { actions: repo.safeParse(rule.actions, []) }, next: [] },
      ],
      variables: [], subflows: [], simulationMode: false, requiresApproval: true,
      createdAt: rule.createdAt.toISOString(), updatedAt: rule.updatedAt.toISOString(),
    });
  }
  const active = workflows.filter(w => w.status === "active").length;
  const draft = workflows.filter(w => w.status === "draft").length;
  log.info("builder.report_complete", { total: workflows.length, active, draft });
  return { generatedAt: new Date().toISOString(), workflows, total: workflows.length, active, draft };
}

// ===========================================================================
// System 2 — Trigger Engine (30+ triggers)
// ===========================================================================

export const TRIGGERS: TriggerDefinition[] = [
  { id: "assessment.published", name: "Assessment Published", category: "assessment", description: "Fires when an assessment is published", eventType: "assessment.published", payloadSchema: { assessmentId: "string", classroomId: "string" } },
  { id: "quiz.completed", name: "Quiz Completed", category: "assessment", description: "Fires when a student completes a quiz", eventType: "assessment.submitted", payloadSchema: { assessmentId: "string", studentId: "string" } },
  { id: "submission.graded", name: "Submission Graded", category: "assessment", description: "Fires when a submission is graded", eventType: "submission.graded", payloadSchema: { submissionId: "string", score: "number" } },
  { id: "student.enrolled", name: "Student Enrolled", category: "enrollment", description: "Fires when a student joins a classroom", eventType: "classroom.student_joined", payloadSchema: { classroomId: "string", studentId: "string" } },
  { id: "teacher.invited", name: "Teacher Invited", category: "user", description: "Fires when a teacher is invited to an org", eventType: "member.invited", payloadSchema: { orgId: "string", email: "string" } },
  { id: "marketplace.purchase", name: "Marketplace Purchase", category: "marketplace", description: "Fires on marketplace purchase", eventType: "purchase.completed", payloadSchema: { purchaseId: "string", listingId: "string" } },
  { id: "invoice.generated", name: "Invoice Generated", category: "billing", description: "Fires when an invoice is generated", eventType: "billing.invoice_paid", payloadSchema: { invoiceId: "string", amount: "number" } },
  { id: "subscription.renewed", name: "Subscription Renewed", category: "billing", description: "Fires on subscription renewal", eventType: "subscription.renewed", payloadSchema: { userId: "string", plan: "string" } },
  { id: "ai.quality.alert", name: "AI Quality Alert", category: "ai", description: "Fires on AI quality degradation", eventType: "ai_quality.alert", payloadSchema: { metric: "string", score: "number" } },
  { id: "governance.approval", name: "Governance Approval Required", category: "governance", description: "Fires when governance approval is needed", eventType: "governance.approval_required", payloadSchema: { type: "string", entityId: "string" } },
  { id: "extension.installed", name: "Extension Installed", category: "developer", description: "Fires when an extension is installed", eventType: "extension.installed", payloadSchema: { extensionId: "string", userId: "string" } },
  { id: "webhook.received", name: "Webhook Received", category: "integration", description: "Fires on inbound webhook", eventType: "webhook.received", payloadSchema: { endpoint: "string", payload: "object" } },
  { id: "cron.schedule", name: "Cron Schedule", category: "schedule", description: "Fires on a cron schedule", eventType: "schedule.fired", payloadSchema: { cron: "string" } },
  { id: "manual.trigger", name: "Manual Trigger", category: "manual", description: "Manually triggered", eventType: "manual.trigger", payloadSchema: {} },
  { id: "api.trigger", name: "API Trigger", category: "api", description: "Triggered via API call", eventType: "api.trigger", payloadSchema: { endpoint: "string", method: "string" } },
  { id: "organization.created", name: "Organization Created", category: "organization", description: "Fires when an org is created", eventType: "organization.created", payloadSchema: { orgId: "string", name: "string" } },
  { id: "research.published", name: "Research Published", category: "research", description: "Fires when research is published", eventType: "publication.published", payloadSchema: { publicationId: "string" } },
  { id: "digital.twin.updated", name: "Digital Twin Updated", category: "twin", description: "Fires when a digital twin is updated", eventType: "twin.updated", payloadSchema: { twinId: "string", twinType: "string" } },
  { id: "goal.achieved", name: "Goal Achieved", category: "goals", description: "Fires when a learning goal is achieved", eventType: "goal.achieved", payloadSchema: { goalId: "string", userId: "string" } },
  { id: "workflow.completed", name: "Workflow Completed", category: "workflow", description: "Fires when another workflow completes", eventType: "workflow.completed", payloadSchema: { workflowId: "string", status: "string" } },
  { id: "cloud.job.finished", name: "Cloud Job Finished", category: "cloud", description: "Fires when a cloud job finishes", eventType: "cloud.job.finished", payloadSchema: { jobId: "string", status: "string" } },
  { id: "certificate.issued", name: "Certificate Issued", category: "certification", description: "Fires when a certificate is issued", eventType: "certificate.issued", payloadSchema: { certificateId: "string", studentId: "string" } },
  { id: "resource.created", name: "Resource Created", category: "content", description: "Fires when a resource is created", eventType: "resource.created", payloadSchema: { resourceId: "string", type: "string" } },
  { id: "discussion.created", name: "Discussion Created", category: "collaboration", description: "Fires when a discussion is created", eventType: "discussion.created", payloadSchema: { discussionId: "string" } },
  { id: "assignment.published", name: "Assignment Published", category: "assessment", description: "Fires when an assignment is published", eventType: "assignment.published", payloadSchema: { assignmentId: "string", classroomId: "string" } },
  { id: "policy.violation", name: "Policy Violation", category: "governance", description: "Fires on AI policy violation", eventType: "governance.violation", payloadSchema: { policyId: "string", severity: "string" } },
  { id: "experiment.completed", name: "Experiment Completed", category: "ai", description: "Fires when an A/B experiment completes", eventType: "experiment.completed", payloadSchema: { experimentId: "string", winner: "string" } },
  { id: "integration.connected", name: "Integration Connected", category: "integration", description: "Fires when an integration is connected", eventType: "integration.connected", payloadSchema: { integrationId: "string", type: "string" } },
  { id: "backup.completed", name: "Backup Completed", category: "system", description: "Fires when a backup completes", eventType: "backup.completed", payloadSchema: { backupId: "string", status: "string" } },
  { id: "anomaly.detected", name: "Anomaly Detected", category: "system", description: "Fires when an anomaly is detected", eventType: "anomaly.detected", payloadSchema: { kind: "string", severity: "string" } },
  { id: "drift.detected", name: "Drift Detected", category: "ai", description: "Fires when AI drift is detected", eventType: "drift.detected", payloadSchema: { type: "string", delta: "number" } },
  { id: "contract.expiring", name: "Contract Expiring", category: "enterprise", description: "Fires when a contract is about to expire", eventType: "contract.expiring", payloadSchema: { contractId: "string", daysToExpiry: "number" } },
];

export async function generateTriggerReport(): Promise<TriggerEngineReport> {
  const byCategory: Record<string, number> = {};
  for (const t of TRIGGERS) byCategory[t.category] = (byCategory[t.category] ?? 0) + 1;
  log.info("triggers.report_complete", { total: TRIGGERS.length });
  return { generatedAt: new Date().toISOString(), triggers: TRIGGERS, total: TRIGGERS.length, byCategory };
}

// ===========================================================================
// System 3 — Condition Engine
// ===========================================================================

export function evaluateCondition(rule: ConditionRule, context: Record<string, unknown>): boolean {
  const fieldValue = String(context[rule.field] ?? "");
  const targetValue = rule.value;
  switch (rule.operator) {
    case "equals": return fieldValue === targetValue;
    case "contains": return fieldValue.includes(targetValue);
    case "greater": return parseFloat(fieldValue) > parseFloat(targetValue);
    case "less": return parseFloat(fieldValue) < parseFloat(targetValue);
    case "regex": try { return new RegExp(targetValue).test(fieldValue); } catch { return false; }
    case "date": return new Date(fieldValue).getTime() === new Date(targetValue).getTime();
    case "time": return fieldValue === targetValue;
    case "role": return String(context["role"] ?? "") === targetValue;
    case "permission": return Array.isArray(context["permissions"]) && (context["permissions"] as string[]).includes(targetValue);
    case "organization": return String(context["organizationId"] ?? "") === targetValue;
    case "subscription": return String(context["subscriptionTier"] ?? "") === targetValue;
    case "ai_provider": return String(context["aiProvider"] ?? "") === targetValue;
    case "feature_flag": return context["featureFlags"] !== undefined && Boolean((context["featureFlags"] as Record<string, boolean>)[targetValue]);
    case "custom_var": return String(context[targetValue] ?? "") === fieldValue;
    default: return false;
  }
}

export function evaluateConditionGroup(group: ConditionGroup, context: Record<string, unknown>): ConditionEvaluationResult {
  const details: string[] = [];
  let evaluated = 0;
  let result: boolean;
  const ruleResults = group.rules.map(rule => {
    evaluated++;
    const matched = evaluateCondition(rule, context);
    details.push(`${rule.field} ${rule.operator} ${rule.value}: ${matched}`);
    return matched;
  });
  const nestedResults = group.nested.map(nested => {
    const nestedResult = evaluateConditionGroup(nested, context);
    evaluated += nestedResult.evaluatedRules;
    details.push(`nested(${nested.logic}): ${nestedResult.matched}`);
    return nestedResult.matched;
  });
  const allResults = [...ruleResults, ...nestedResults];
  switch (group.logic) {
    case "AND": result = allResults.every(r => r); break;
    case "OR": result = allResults.some(r => r); break;
    case "NOT": result = !allResults.every(r => r); break;
    default: result = allResults.every(r => r);
  }
  return { matched: result, evaluatedRules: evaluated, details };
}
