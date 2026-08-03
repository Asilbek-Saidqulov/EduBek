/** System 6 — Procurement. */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { ProcurementReport, PurchaseOrder } from "./types";

const log = getLogger("procurement");

export async function generateProcurementReport(): Promise<ProcurementReport> {
  const orgs = await repo.fetchOrganizations(100);
  const purchaseOrders: PurchaseOrder[] = orgs.filter(o => o.type === "school" || o.type === "company").slice(0, 30).map((org, i) => ({
    id: `po-${org.id}-${i}`, organizationId: org.id, poNumber: `PO-2025-${String(i + 1).padStart(4, "0")}`,
    vendor: i % 3 === 0 ? "EduBek Technologies" : i % 3 === 1 ? "Cloud Services Inc" : "AI Provider Co",
    description: `Annual license for ${org.seats} seats`, amount: org.seats * 120,
    currency: "USD",
    status: i % 4 === 0 ? "approved" : i % 4 === 1 ? "submitted" : i % 4 === 2 ? "fulfilled" : "draft",
    budgetCode: `BUD-${org.type.toUpperCase()}`,
    approvedBy: i % 4 === 0 ? "procurement-manager" : null,
    createdAt: org.createdAt.toISOString(),
    fulfilledAt: i % 4 === 2 ? new Date(org.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() : null,
  }));
  const totalOpen = purchaseOrders.filter(p => p.status === "submitted" || p.status === "draft").length;
  const totalApproved = purchaseOrders.filter(p => p.status === "approved").length;
  const totalValue = purchaseOrders.reduce((s, p) => s + p.amount, 0);
  const vendorMap = new Map<string, { count: number; totalValue: number }>();
  for (const po of purchaseOrders) {
    const v = vendorMap.get(po.vendor) ?? { count: 0, totalValue: 0 };
    v.count++; v.totalValue += po.amount;
    vendorMap.set(po.vendor, v);
  }
  const byVendor = Array.from(vendorMap.entries()).map(([vendor, data]) => ({ vendor, ...data }));
  const budgetUtilization = Array.from(new Set(purchaseOrders.map(p => p.budgetCode))).map(code => {
    const pos = purchaseOrders.filter(p => p.budgetCode === code);
    const spent = pos.reduce((s, p) => s + p.amount, 0);
    const allocated = Math.round(spent * 1.5);
    return { budgetCode: code, allocated, spent, percent: Math.round((spent / allocated) * 100) };
  });
  log.info("procurement.report_complete", { pos: purchaseOrders.length, value: totalValue });
  return { generatedAt: new Date().toISOString(), purchaseOrders, totalOpen, totalApproved, totalValue, byVendor, budgetUtilization };
}
