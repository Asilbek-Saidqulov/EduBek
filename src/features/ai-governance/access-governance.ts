/**
 * EduBek — Access Governance (System 9).
 * Controls access to providers, models, agents, AI features, prompt
 * libraries, datasets, benchmarks, experiments. Supports RBAC, ABAC,
 * organization inheritance, temporary permissions.
 */
import { getLogger } from "@/lib/logger";
import type { AccessPolicy, AccessGovernanceReport } from "./types";

const log = getLogger("access-governance");

const BUILTIN_POLICIES: AccessPolicy[] = [
  {
    id: "access-zai-provider",
    resource: "zai",
    resourceType: "provider",
    allowedRoles: ["student", "teacher", "admin", "superadmin"],
    allowedOrganizations: [],
    temporaryGrants: [],
    inheritedFrom: "platform",
  },
  {
    id: "access-openai-provider",
    resource: "openai",
    resourceType: "provider",
    allowedRoles: ["teacher", "admin", "superadmin"],
    allowedOrganizations: [],
    temporaryGrants: [],
    inheritedFrom: "platform",
  },
  {
    id: "access-ai-workspace",
    resource: "ai-workspace",
    resourceType: "feature",
    allowedRoles: ["teacher", "student", "admin", "superadmin"],
    allowedOrganizations: [],
    temporaryGrants: [],
    inheritedFrom: "platform",
  },
  {
    id: "access-cognitive-ai",
    resource: "cognitive-ai",
    resourceType: "feature",
    allowedRoles: ["teacher", "admin", "superadmin"],
    allowedOrganizations: [],
    temporaryGrants: [],
    inheritedFrom: "platform",
  },
  {
    id: "access-prompt-registry",
    resource: "prompt-registry",
    resourceType: "prompt_library",
    allowedRoles: ["admin", "superadmin"],
    allowedOrganizations: [],
    temporaryGrants: [],
    inheritedFrom: "platform",
  },
  {
    id: "access-benchmarks",
    resource: "ai-quality-benchmarks",
    resourceType: "benchmark",
    allowedRoles: ["admin", "superadmin"],
    allowedOrganizations: [],
    temporaryGrants: [],
    inheritedFrom: "platform",
  },
  {
    id: "access-experiments",
    resource: "ai-observability-experiments",
    resourceType: "experiment",
    allowedRoles: ["admin", "superadmin"],
    allowedOrganizations: [],
    temporaryGrants: [],
    inheritedFrom: "platform",
  },
];

export async function generateAccessReport(): Promise<AccessGovernanceReport> {
  const policies = BUILTIN_POLICIES;
  const temporaryGrants = policies.reduce((s, p) => s + p.temporaryGrants.length, 0);
  const now = Date.now();
  const expiringSoon = policies.reduce((s, p) =>
    s + p.temporaryGrants.filter(g => new Date(g.expiresAt).getTime() - now < 24 * 60 * 60 * 1000).length, 0);
  log.info("access.report_complete", { policies: policies.length, temporaryGrants, expiringSoon });
  return {
    generatedAt: new Date().toISOString(),
    policies, totalPolicies: policies.length, temporaryGrants, expiringSoon,
  };
}

export function checkAccess(input: {
  resource: string; resourceType: AccessPolicy["resourceType"];
  role: string; organizationId?: string | null;
}): { allowed: boolean; reason: string } {
  const policy = BUILTIN_POLICIES.find(p => p.resource === input.resource && p.resourceType === input.resourceType);
  if (!policy) return { allowed: false, reason: "No access policy defined for this resource." };
  const roleAllowed = policy.allowedRoles.includes(input.role);
  if (!roleAllowed) return { allowed: false, reason: `Role "${input.role}" is not allowed to access "${input.resource}".` };
  if (input.organizationId && policy.allowedOrganizations.length > 0 && !policy.allowedOrganizations.includes(input.organizationId)) {
    return { allowed: false, reason: `Organization "${input.organizationId}" is not allowed.` };
  }
  return { allowed: true, reason: "Access granted." };
}
