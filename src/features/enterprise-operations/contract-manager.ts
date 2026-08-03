/** System 5 — Contract Manager. */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { EnterpriseContract, ContractReport } from "./types";

const log = getLogger("contract-manager");

export async function generateContractReport(): Promise<ContractReport> {
  const orgs = await repo.fetchOrganizations(100);
  const contracts: EnterpriseContract[] = orgs.filter(o => o.plan === "enterprise" || o.plan === "pro").slice(0, 50).map((org, i) => {
    const endDate = new Date(org.createdAt.getTime() + 365 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const daysToRenewal = Math.round((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    const renewalStatus = daysToRenewal < 0 ? "overdue" : daysToRenewal < 30 ? "due_soon" : "not_due";
    return {
      id: `contract-${org.id}-${i}`, organizationId: org.id,
      title: `${org.name} Enterprise Agreement`, type: "enterprise",
      status: "active", startDate: org.createdAt.toISOString(),
      endDate: endDate.toISOString(), value: org.plan === "enterprise" ? 12000 : 2400,
      currency: "USD", slaTier: org.plan === "enterprise" ? "enterprise" : "standard",
      supportPlan: org.plan === "enterprise" ? "Premium 24/7" : "Standard Business Hours",
      documents: [], renewalStatus,
      createdAt: org.createdAt.toISOString(),
    };
  });
  const totalActive = contracts.filter(c => c.status === "active").length;
  const totalValue = contracts.reduce((s, c) => s + c.value, 0);
  const expiringSoon = contracts.filter(c => c.renewalStatus === "due_soon").length;
  const overdue = contracts.filter(c => c.renewalStatus === "overdue").length;
  log.info("contract.report_complete", { active: totalActive, value: totalValue, expiring: expiringSoon });
  return { generatedAt: new Date().toISOString(), contracts, totalActive, totalValue, expiringSoon, overdue };
}
