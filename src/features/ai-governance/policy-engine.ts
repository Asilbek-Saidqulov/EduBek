/**
 * EduBek — AI Policy Engine (System 1).
 * Hierarchical policy management: platform → organization → department → user.
 * Policies evaluate compliance — never modify requests.
 */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { AIPolicy, PolicyRule, PolicyEvaluationResult, PolicyEngineReport, PolicyScope } from "./types";

const log = getLogger("policy-engine");

export async function createPolicy(input: {
  scope: PolicyScope; scopeId?: string | null; name: string;
  description?: string; rules?: PolicyRule[];
}): Promise<AIPolicy> {
  const row = await repo.createPolicy(input);
  log.info("policy.created", { id: row.id, scope: input.scope, name: input.name });
  return mapPolicy(row);
}

export async function listPolicies(scope?: PolicyScope, scopeId?: string): Promise<AIPolicy[]> {
  const rows = await repo.listPolicies(scope, scopeId);
  return rows.map(mapPolicy);
}

export async function evaluateCompliance(input: {
  provider: string; model: string; tokensIn: number; tokensOut: number;
  costUsd: number; feature: string | null; scope: PolicyScope; scopeId: string | null;
}): Promise<PolicyEvaluationResult[]> {
  const policies = await listPolicies(input.scope, input.scopeId ?? undefined);
  const results: PolicyEvaluationResult[] = [];
  for (const policy of policies) {
    const violations: PolicyEvaluationResult["violations"] = [];
    for (const rule of policy.rules) {
      const violation = checkRule(rule, input);
      if (violation) violations.push(violation);
    }
    results.push({
      policyId: policy.id,
      compliant: violations.length === 0,
      violations,
      inheritedRules: policy.inheritedFrom ? policy.rules.length : 0,
      effectiveRules: policy.rules.length,
    });
  }
  return results;
}

export async function generatePolicyReport(): Promise<PolicyEngineReport> {
  const policies = await listPolicies();
  const activePolicies = policies.filter(p => p.status === "active").length;
  log.info("policy.report_complete", { total: policies.length, active: activePolicies });
  return {
    generatedAt: new Date().toISOString(),
    policies, totalPolicies: policies.length, activePolicies,
    evaluations: [],
  };
}

function checkRule(rule: PolicyRule, input: {
  provider: string; model: string; tokensIn: number; tokensOut: number;
  costUsd: number; feature: string | null;
}): PolicyEvaluationResult["violations"][number] | null {
  switch (rule.type) {
    case "allowed_models": {
      const allowed = rule.value as string[];
      if (!allowed.includes(input.model)) {
        return { rule: "allowed_models", expected: allowed.join(", "), actual: input.model, severity: "high" };
      }
      return null;
    }
    case "blocked_models": {
      const blocked = rule.value as string[];
      if (blocked.includes(input.model)) {
        return { rule: "blocked_models", expected: "not in blocked list", actual: input.model, severity: "high" };
      }
      return null;
    }
    case "max_context": {
      const max = rule.value as number;
      if (input.tokensIn > max) {
        return { rule: "max_context", expected: String(max), actual: String(input.tokensIn), severity: "medium" };
      }
      return null;
    }
    case "max_tokens": {
      const max = rule.value as number;
      if (input.tokensIn + input.tokensOut > max) {
        return { rule: "max_tokens", expected: String(max), actual: String(input.tokensIn + input.tokensOut), severity: "medium" };
      }
      return null;
    }
    case "cost_limit": {
      const limit = rule.value as number;
      if (input.costUsd > limit) {
        return { rule: "cost_limit", expected: String(limit), actual: String(input.costUsd), severity: "high" };
      }
      return null;
    }
    default:
      return null;
  }
}

function mapPolicy(row: Awaited<ReturnType<typeof repo.createPolicy>>): AIPolicy {
  return {
    id: row.id, scope: row.scope as PolicyScope, scopeId: row.scopeId,
    name: row.name, description: row.description,
    rules: repo.safeParse<PolicyRule[]>(row.rules, []),
    inheritedFrom: row.inheritedFrom, status: row.status as AIPolicy["status"],
    createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
  };
}
