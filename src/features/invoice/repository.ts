/**
 * EduBek — Invoice repository.
 *
 * The only layer that imports `db` for this feature. The repository also
 * owns the invoice-number sequence (sequential, human-friendly numbers of
 * the form `INV-2024-000123`).
 */
import { db } from "@/lib/db";

const NUMBER_PREFIX = "INV";

function formatNumber(seq: number, year: number): string {
  return `${NUMBER_PREFIX}-${year}-${String(seq).padStart(6, "0")}`;
}

/**
 * Allocate the next sequential invoice number for the current year. Uses an
 * atomic upsert pattern: read the highest existing sequence for this year,
 * then create with seq+1. SQLite serializes writes so this is safe under
 * the sandbox's single-writer assumption.
 */
async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `${NUMBER_PREFIX}-${year}-`;
  const last = await db.invoice.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  let nextSeq = 1;
  if (last) {
    const tail = last.number.slice(prefix.length);
    const parsed = Number.parseInt(tail, 10);
    if (!Number.isNaN(parsed)) nextSeq = parsed + 1;
  }
  return formatNumber(nextSeq, year);
}

export async function create(data: {
  userId: string;
  transactionId?: string | null;
  amount: number;
  currency?: string;
  tax?: number;
  dueAt?: Date | null;
  pdfUrl?: string | null;
}) {
  const number = await nextInvoiceNumber();
  return db.invoice.create({
    data: {
      number,
      userId: data.userId,
      transactionId: data.transactionId ?? null,
      amount: data.amount,
      currency: data.currency ?? "USD",
      tax: data.tax ?? 0,
      dueAt: data.dueAt ?? null,
      pdfUrl: data.pdfUrl ?? null,
      status: "open",
    },
  });
}

export async function findById(id: string) {
  return db.invoice.findUnique({ where: { id } });
}

export async function findByNumber(number: string) {
  return db.invoice.findUnique({ where: { number } });
}

export async function findByUser(
  userId: string,
  limit = 20,
  offset = 0,
): Promise<{ invoices: any[]; total: number }> {
  const [invoices, total] = await Promise.all([
    db.invoice.findMany({
      where: { userId },
      orderBy: { issuedAt: "desc" },
      take: limit,
      skip: offset,
    }),
    db.invoice.count({ where: { userId } }),
  ]);
  return { invoices, total };
}

export async function findByOrg(
  orgId: string,
  limit = 20,
  offset = 0,
): Promise<{ invoices: any[]; total: number }> {
  // Org-level invoices are identified by the user being a member of the org.
  // We look up the org's member ids first, then filter invoices.
  const members = await db.organizationMembership.findMany({
    where: { orgId, status: "active" },
    select: { userId: true },
  });
  const userIds = members.map((m) => m.userId);
  if (userIds.length === 0) return { invoices: [], total: 0 };
  const [invoices, total] = await Promise.all([
    db.invoice.findMany({
      where: { userId: { in: userIds } },
      orderBy: { issuedAt: "desc" },
      take: limit,
      skip: offset,
    }),
    db.invoice.count({ where: { userId: { in: userIds } } }),
  ]);
  return { invoices, total };
}

export async function updateStatus(
  id: string,
  status: string,
  pdfUrl?: string,
) {
  const data: Record<string, unknown> = { status };
  if (pdfUrl !== undefined) data.pdfUrl = pdfUrl;
  return db.invoice.update({ where: { id }, data });
}
