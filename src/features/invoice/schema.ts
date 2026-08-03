/**
 * EduBek — Invoice feature schemas.
 *
 * Invoices are generated internally from subscriptions, marketplace
 * purchases, and payouts — there is no public "create invoice" endpoint.
 * This file therefore exposes no input schemas; the `GenerateInvoiceInput`
 * type lives in `types.ts` and is consumed by the service directly.
 *
 * The placeholder below exists so that the module's file layout mirrors the
 * other Phase 3C features (each feature has a `schema.ts`) — future phases
 * can drop public-facing schemas here without restructuring the module.
 */
export {};
