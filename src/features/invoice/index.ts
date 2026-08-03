/**
 * EduBek — Invoice feature barrel export.
 */
export {
  generateInvoice,
  getInvoice,
  listInvoices,
  markPaid,
} from "./service";

export type {
  InvoiceDto,
  InvoiceStatus,
  GenerateInvoiceInput,
} from "./types";
