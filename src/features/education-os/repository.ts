/**
 * EduBek — Education OS repository.
 *
 * Direct Prisma access for the 5 Phase 4F.6 models:
 *   AgentMemory, AgentWorkflow, AutomationRule,
 *   AgentExecutionLog, SimulationResult.
 *
 * No business logic — pure data access.
 */
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// Agent Memory
// ---------------------------------------------------------------------------

export async function createMemory(input: {
  scopeType: string;
  scopeId: string;
  type: string;
  summary: string;
  payload?: string;
  importance?: number;
  agentType?: string;
  workflowId?: string;
  expiresAt?: Date;
}) {
  return db.agentMemory.create({ data: input });
}

export async function findMemories(input: {
  scopeType?: string;
  scopeId?: string;
  type?: string;
  agentType?: string;
  limit?: number;
}) {
  return db.agentMemory.findMany({
    where: input,
    orderBy: [{ importance: "desc" }, { createdAt: "desc" }],
    take: input.limit ?? 50,
  });
}

export async function findMemory(id: string) {
  return db.agentMemory.findUnique({ where: { id } });
}

export async function deleteMemory(id: string) {
  return db.agentMemory.delete({ where: { id } });
}

export async function deleteExpiredMemories(): Promise<number> {
  const result = await db.agentMemory.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}

export async function countMemories(scopeType?: string, scopeId?: string): Promise<number> {
  return db.agentMemory.count({
    where: { scopeType, scopeId },
  });
}

// ---------------------------------------------------------------------------
// Agent Workflows
// ---------------------------------------------------------------------------

export async function createWorkflow(input: {
  type: string;
  initiatedBy: string;
  scopeType: string;
  scopeId: string;
  status?: string;
  steps?: string;
  participatingAgents?: string;
}) {
  return db.agentWorkflow.create({ data: input });
}

export async function findWorkflow(id: string) {
  return db.agentWorkflow.findUnique({ where: { id } });
}

export async function findWorkflows(input: {
  initiatedBy?: string;
  scopeType?: string;
  scopeId?: string;
  type?: string;
  status?: string;
  limit?: number;
}) {
  return db.agentWorkflow.findMany({
    where: input,
    orderBy: { createdAt: "desc" },
    take: input.limit ?? 50,
  });
}

export async function updateWorkflow(id: string, data: Record<string, unknown>) {
  return db.agentWorkflow.update({ where: { id }, data });
}

export async function countWorkflows(): Promise<number> {
  return db.agentWorkflow.count();
}

// ---------------------------------------------------------------------------
// Automation Rules
// ---------------------------------------------------------------------------

export async function createAutomationRule(input: {
  name: string;
  description?: string;
  ownerId: string;
  scopeType: string;
  scopeId: string;
  trigger: string;
  actions: string;
  enabled?: boolean;
  maxPerHour?: number;
}) {
  return db.automationRule.create({ data: input });
}

export async function findAutomationRule(id: string) {
  return db.automationRule.findUnique({ where: { id } });
}

export async function findAutomationRules(input: {
  ownerId?: string;
  scopeType?: string;
  scopeId?: string;
  enabled?: boolean;
  limit?: number;
}) {
  return db.automationRule.findMany({
    where: input,
    orderBy: { createdAt: "desc" },
    take: input.limit ?? 50,
  });
}

export async function findEnabledAutomationsForEvent(eventType: string): Promise<any[]> {
  // We can't easily query JSON in SQLite, so fetch all enabled rules
  // and filter in JS by parsing the trigger.
  const allRules = await db.automationRule.findMany({
    where: { enabled: true },
  });
  return allRules.filter((r) => {
    try {
      const trigger = JSON.parse(r.trigger);
      return trigger.event === eventType;
    } catch {
      return false;
    }
  });
}

export async function updateAutomationRule(id: string, data: Record<string, unknown>) {
  return db.automationRule.update({ where: { id }, data });
}

export async function deleteAutomationRule(id: string) {
  return db.automationRule.delete({ where: { id } });
}

export async function countEnabledAutomations(): Promise<number> {
  return db.automationRule.count({ where: { enabled: true } });
}

// ---------------------------------------------------------------------------
// Agent Execution Logs
// ---------------------------------------------------------------------------

export async function createExecutionLog(input: {
  agentType: string;
  task: string;
  input?: string;
  output?: string;
  confidence?: number;
  reasoning?: string;
  sources?: string;
  affectedModules?: string;
  status?: string;
  executionMs?: number;
  error?: string;
  scopeType?: string;
  scopeId?: string;
  workflowId?: string;
}) {
  return db.agentExecutionLog.create({ data: input });
}

export async function findExecutionLog(id: string) {
  return db.agentExecutionLog.findUnique({ where: { id } });
}

export async function findExecutionLogs(input: {
  agentType?: string;
  status?: string;
  scopeType?: string;
  scopeId?: string;
  workflowId?: string;
  limit?: number;
}) {
  return db.agentExecutionLog.findMany({
    where: input,
    orderBy: { createdAt: "desc" },
    take: input.limit ?? 50,
  });
}

export async function updateExecutionLog(id: string, data: Record<string, unknown>) {
  return db.agentExecutionLog.update({ where: { id }, data });
}

// ---------------------------------------------------------------------------
// Simulation Results
// ---------------------------------------------------------------------------

export async function createSimulationResult(input: {
  scenario: string;
  input?: string;
  predictions?: string;
  affected?: string;
  estimatedCosts?: string;
  summary?: string;
  confidence?: number;
}) {
  return db.simulationResult.create({ data: input });
}

export async function findSimulationResult(id: string) {
  return db.simulationResult.findUnique({ where: { id } });
}

export async function findSimulationResults(input: {
  scenario?: string;
  limit?: number;
}) {
  return db.simulationResult.findMany({
    where: input,
    orderBy: { createdAt: "desc" },
    take: input.limit ?? 20,
  });
}
