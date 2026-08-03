/** System 4 — Invoice Management. Reuses Invoice model. */
import { getLogger } from "@/lib/logger";
import * as repo from "./repository";
import type { InvoiceSummary, InvoiceReport, InvoiceType } from "./types";

const log = getLogger("invoice-engine");

export async function generateInvoiceReport(): Promise<InvoiceReport> {
  const invoices = await repo.fetchInvoices(200);
  const summaries: InvoiceSummary[] = invoices.map(inv => ({
    id: inv.id, number: inv.number, type: "monthly" as InvoiceType,
    userId: inv.userId, organizationId: null,
    amount: inv.amount, tax: inv.tax, currency: inv.currency,
    status: inv.status as InvoiceSummary["status"],
    issuedAt: inv.issuedAt.toISOString(), dueAt: inv.dueAt?.toISOString() ?? null,
    paidAt: null, pdfUrl: inv.pdfUrl,
  }));
  const totalIssued = summaries.reduce((s, i) => s + i.amount, 0);
  const totalPaid = summaries.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const totalOutstanding = summaries.filter(i => i.status === "open").reduce((s, i) => s + i.amount, 0);
  const now = new Date();
  const totalOverdue = summaries.filter(i => i.status === "open" && i.dueAt && new Date(i.dueAt) < now).reduce((s, i) => s + i.amount, 0);
  const byType: Record<string, number> = { monthly: summaries.length };
  log.info("invoice.report_complete", { total: summaries.length, paid: totalPaid, outstanding: totalOutstanding });
  return { generatedAt: new Date().toISOString(), invoices: summaries, totalIssued: Math.round(totalIssued * 100) / 100, totalPaid: Math.round(totalPaid * 100) / 100, totalOutstanding: Math.round(totalOutstanding * 100) / 100, totalOverdue: Math.round(totalOverdue * 100) / 100, byType };
}
