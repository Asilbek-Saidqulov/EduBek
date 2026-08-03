/** System 14 — Business Reports. */
import { getLogger } from "@/lib/logger";
import { generateRevenueReport } from "./revenue-analytics";
import { generateSubscriptionReport } from "./subscription-engine";
import { generateCustomerSuccessReport } from "./customer-success";
import { generateOrganizationHealth } from "./organization-health";
import * as repo from "./repository";
import type { BusinessReport, ReportType } from "./types";

const log = getLogger("reporting");

export async function generateBusinessReport(type: ReportType): Promise<BusinessReport> {
  const id = `report-${type}-${Date.now()}`;
  const period = new Date().toISOString().slice(0, 7);
  const generatedAt = new Date().toISOString();
  switch (type) {
    case "executive": {
      const [orgs, users, revenue] = await Promise.all([repo.countOrganizations(), repo.countUsers(), generateRevenueReport().catch(() => null)]);
      return { id, type, title: "Executive Report", period, generatedAt,
        summary: `${orgs} organizations, ${users} users. Revenue: $${revenue?.totalRevenue.toFixed(2) ?? "N/A"}.`,
        sections: [
          { title: "Organizations", content: `${orgs} total organizations.`, metrics: { total: orgs } },
          { title: "Users", content: `${users} total users.`, metrics: { total: users } },
          { title: "Revenue", content: `MRR: $${revenue?.mrr.toFixed(2) ?? "0"}. ARR: $${revenue?.arr.toFixed(2) ?? "0"}.`, metrics: { mrr: revenue?.mrr ?? 0, arr: revenue?.arr ?? 0 } },
        ],
      };
    }
    case "financial": {
      const revenue = await generateRevenueReport().catch(() => null);
      return { id, type, title: "Financial Report", period, generatedAt,
        summary: `Total revenue: $${revenue?.totalRevenue.toFixed(2) ?? "0"}. MRR: $${revenue?.mrr.toFixed(2) ?? "0"}.`,
        sections: [
          { title: "Revenue", content: `MRR: $${revenue?.mrr ?? 0}, ARR: $${revenue?.arr ?? 0}, LTV: $${revenue?.ltv ?? 0}`, metrics: { mrr: revenue?.mrr ?? 0, arr: revenue?.arr ?? 0, ltv: revenue?.ltv ?? 0 } },
          { title: "Costs", content: `AI cost: $${revenue?.byAI.aiCost ?? 0}. CAC: $${revenue?.cac ?? 0}.`, metrics: { aiCost: revenue?.byAI.aiCost ?? 0, cac: revenue?.cac ?? 0 } },
          { title: "Churn", content: `Churn rate: ${((revenue?.churnRate ?? 0) * 100).toFixed(1)}%. NRR: ${((revenue?.netRevenueRetention ?? 1) * 100).toFixed(0)}%.`, metrics: { churnRate: revenue?.churnRate ?? 0, nrr: revenue?.netRevenueRetention ?? 1 } },
        ],
      };
    }
    case "customer": {
      const cs = await generateCustomerSuccessReport().catch(() => null);
      return { id, type, title: "Customer Report", period, generatedAt,
        summary: `${cs?.totalOrganizations ?? 0} organizations tracked. Avg health: ${cs?.avgHealthScore ?? 0}/100. At risk: ${cs?.atRiskCount ?? 0}.`,
        sections: [
          { title: "Health", content: `Average health score: ${cs?.avgHealthScore ?? 0}.`, metrics: { avgHealth: cs?.avgHealthScore ?? 0 } },
          { title: "Renewal", content: `Average renewal probability: ${cs?.avgRenewalProbability ?? 0}.`, metrics: { avgRenewal: cs?.avgRenewalProbability ?? 0 } },
        ],
      };
    }
    case "subscription": {
      const subs = await generateSubscriptionReport().catch(() => null);
      return { id, type, title: "Subscription Report", period, generatedAt,
        summary: `${subs?.totalActive ?? 0} active subscriptions. MRR: $${subs?.totalMRR.toFixed(2) ?? "0"}.`,
        sections: [{ title: "By Tier", content: JSON.stringify(subs?.byTier ?? {}), metrics: subs?.byTier ?? {} }],
      };
    }
    case "organization": {
      const orgs = await repo.fetchOrganizations(50);
      return { id, type, title: "Organization Report", period, generatedAt,
        summary: `${orgs.length} organizations.`,
        sections: orgs.slice(0, 5).map(o => ({ title: o.name, content: `Plan: ${o.plan}, Seats: ${o.seats}, Country: ${o.country ?? "N/A"}`, metrics: { seats: o.seats } })),
      };
    }
    case "growth": {
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const [totalOrgs, newOrgs, totalUsers, newUsers] = await Promise.all([repo.countOrganizations(), repo.countOrganizationsSince(monthAgo), repo.countUsers(), repo.countUsersSince(monthAgo)]);
      return { id, type, title: "Growth Report", period, generatedAt,
        summary: `${newOrgs} new organizations, ${newUsers} new users this month.`,
        sections: [
          { title: "Organizations", content: `${totalOrgs} total, ${newOrgs} new this month.`, metrics: { total: totalOrgs, new: newOrgs } },
          { title: "Users", content: `${totalUsers} total, ${newUsers} new this month.`, metrics: { total: totalUsers, new: newUsers } },
        ],
      };
    }
    case "usage": {
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const [aiCostAgg, marketplaceAgg, activeUsers] = await Promise.all([repo.fetchAIInvocationCost(monthAgo), repo.aggregateMarketplaceRevenue(monthAgo), repo.countActiveUsersSince(monthAgo)]);
      return { id, type, title: "Usage Report", period, generatedAt,
        summary: `${activeUsers} active users, ${aiCostAgg._count} AI calls, ${marketplaceAgg._count} marketplace purchases.`,
        sections: [
          { title: "AI Usage", content: `${aiCostAgg._count} AI calls costing $${(aiCostAgg._sum.costUsd ?? 0).toFixed(2)}.`, metrics: { calls: aiCostAgg._count, cost: aiCostAgg._sum.costUsd ?? 0 } },
          { title: "Marketplace", content: `${marketplaceAgg._count} purchases totaling $${(marketplaceAgg._sum.amountPaid ?? 0).toFixed(2)}.`, metrics: { purchases: marketplaceAgg._count, revenue: marketplaceAgg._sum.amountPaid ?? 0 } },
        ],
      };
    }
  }
}
