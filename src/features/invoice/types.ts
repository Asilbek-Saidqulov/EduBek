/**
 * EduBek — Invoice feature types.
 *
 * Invoices are generated internally whenever a monetary transaction occurs
 * (subscription, marketplace purchase, payout). They are not user-creatable;
 * they exist for accounting, tax, and dispute-resolution purposes.
 */

export type InvoiceStatus = "draft" | "open" | "paid" | "void";

export interface InvoiceDto {
  id: string;
  number: string;
  userId: string;
  transactionId: string | null;
  amount: number;
  currency: string;
  tax: number;
  pdfUrl: string | null;
  status: InvoiceStatus;
  issuedAt: string;
  dueAt: string | null;
}

/** Internal payload used when generating an invoice from a transaction. */
export interface GenerateInvoiceInput {
  userId: string;
  transactionId?: string | null;
  amount: number;
  currency?: string;
  tax?: number;
  dueAt?: Date | null;
  description?: string;
}
