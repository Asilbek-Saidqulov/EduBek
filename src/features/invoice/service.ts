/**
 * EduBek — Invoice service.
 *
 * Invoices are generated internally (from subscriptions, purchases, payouts)
 * and are read-only for end users. Only admins can mark an invoice paid.
 *
 * Events published:
 *   • INVOICE_CREATED — when an invoice is generated
 *   • INVOICE_PAID   — when an admin marks an invoice paid
 */
import { logger } from "@/lib/logger";
import {
  forbidden,
  notFound,
  unauthorized,
} from "@/lib/errors";
import {
  can,
  PlatformPermission,
  PersonalPermission,
  type AuthContext,
} from "@/features/rbac";
import { eventBus } from "@/infra/event-bus";
import {
  buildEvent,
  INVOICE_CREATED,
  INVOICE_PAID,
  type InvoiceCreatedEvent,
  type InvoicePaidEvent,
} from "@/infra/event-bus/events";
import * as repo from "./repository";
import type { GenerateInvoiceInput, InvoiceDto, InvoiceStatus } from "./types";

const log = logger.child({ module: "invoice-service" });

function mapInvoice(i: any): InvoiceDto {
  return {
    id: i.id,
    number: i.number,
    userId: i.userId,
    transactionId: i.transactionId ?? null,
    amount: i.amount,
    currency: i.currency,
    tax: i.tax,
    pdfUrl: i.pdfUrl ?? null,
    status: i.status as InvoiceStatus,
    issuedAt: i.issuedAt.toISOString(),
    dueAt: i.dueAt ? i.dueAt.toISOString() : null,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function generateInvoice(
  ctx: AuthContext,
  data: GenerateInvoiceInput,
): Promise<InvoiceDto> {
  // Internal callers (system, admin) may generate invoices for any user.
  // End-user requests are not supposed to reach this path — the API routes
  // do not expose a "create invoice" endpoint.
  if (!ctx.userId && !ctx.isSuperadmin) {
    throw unauthorized("Authentication required");
  }
  if (data.amount < 0) {
    throw notFound("Invoice amount must be non-negative");
  }
  const invoice = await repo.create({
    userId: data.userId,
    transactionId: data.transactionId,
    amount: data.amount,
    currency: data.currency,
    tax: data.tax,
    dueAt: data.dueAt,
  });
  const dto = mapInvoice(invoice);
  eventBus.publish(
    buildEvent<InvoiceCreatedEvent>({
      type: INVOICE_CREATED,
      actorId: ctx.userId,
      invoiceId: invoice.id,
      userId: invoice.userId,
      transactionId: invoice.transactionId ?? undefined,
      amount: invoice.amount,
      currency: invoice.currency,
      occurredAt: new Date(),
    }),
  );
  log.info("invoice.created", {
    invoiceId: invoice.id,
    number: invoice.number,
    userId: invoice.userId,
  });
  return dto;
}

export async function getInvoice(
  ctx: AuthContext,
  id: string,
): Promise<InvoiceDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.INVOICE_VIEW)) {
    throw forbidden("No permission to view invoices");
  }
  const invoice = await repo.findById(id);
  if (!invoice) throw notFound("Invoice not found");
  // Owner can view their own invoices; admins can view any.
  if (invoice.userId !== ctx.userId && !can(ctx, PlatformPermission.INVOICE_MANAGE)) {
    throw forbidden("Cannot view this invoice");
  }
  return mapInvoice(invoice);
}

export async function listInvoices(
  ctx: AuthContext,
  limit = 20,
  offset = 0,
): Promise<{ invoices: InvoiceDto[]; total: number }> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.INVOICE_VIEW)) {
    throw forbidden("No permission to view invoices");
  }
  const { invoices, total } = await repo.findByUser(ctx.userId, limit, offset);
  return { invoices: invoices.map(mapInvoice), total };
}

export async function markPaid(
  ctx: AuthContext,
  id: string,
  provider: string,
): Promise<InvoiceDto> {
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PlatformPermission.INVOICE_MANAGE)) {
    throw forbidden("Admin only");
  }
  const invoice = await repo.findById(id);
  if (!invoice) throw notFound("Invoice not found");
  if (invoice.status === "paid") {
    throw notFound("Invoice already paid");
  }
  const updated = await repo.updateStatus(id, "paid");
  const dto = mapInvoice(updated);
  eventBus.publish(
    buildEvent<InvoicePaidEvent>({
      type: INVOICE_PAID,
      actorId: ctx.userId,
      invoiceId: updated.id,
      userId: updated.userId,
      amount: updated.amount,
      paymentProvider: provider,
      occurredAt: new Date(),
    }),
  );
  log.info("invoice.paid", { invoiceId: updated.id, provider });
  return dto;
}
