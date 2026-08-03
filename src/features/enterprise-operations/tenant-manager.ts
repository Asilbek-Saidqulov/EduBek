/** System 1 — Enterprise Tenant Manager. Reuses Organization model. */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { EnterpriseTenant, TenantManagerReport, TenantType } from "./types";

const log = getLogger("tenant-manager");

export async function generateTenantReport(): Promise<TenantManagerReport> {
  const orgs = await repo.fetchOrganizations(500);
  const tenants: EnterpriseTenant[] = orgs.map(org => ({
    id: org.id, organizationId: org.id, name: org.name,
    type: (org.type === "school" ? "school" : org.type === "company" ? "subsidiary" : "university") as TenantType,
    parentId: null, children: [], country: org.country,
    seats: org.seats, usedSeats: Math.floor(org.seats * 0.6), plan: org.plan,
    branding: { logo: null, primaryColor: null, customDomain: null },
    resourceLimits: { maxStorageGb: 100, maxAiCallsPerMonth: 10000, maxUsers: org.seats },
    health: "healthy" as const, createdAt: org.createdAt.toISOString(),
  }));
  const byType: Record<string, number> = {};
  for (const t of tenants) byType[t.type] = (byType[t.type] ?? 0) + 1;
  log.info("tenant.report_complete", { tenants: tenants.length });
  return { generatedAt: new Date().toISOString(), tenants, totalTenants: tenants.length, byType, hierarchyDepth: 1 };
}
