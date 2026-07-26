import { QuoteDialogValues } from "@/app/(dashboard)/companies/validation";
import { InsertQuotes, SelectQuotes } from "@/db/schema/quotes";
import { toDateInput } from "@/lib/helpers";

// The quote dialog edits only a subset of the Quotes columns — these two
// mappers convert between that subset and the stored row. Columns the dialog
// doesn't show (contact/project/contract links, delivery details, the computed
// summary snapshot) are never written on update, so values assigned elsewhere
// survive later edits. The quote date columns are Date-mode, so the dialog's
// YYYY-MM-DD strings convert to Date on write and back via toDateInput on read.

export const quoteRowToDialogValues = (
  row: SelectQuotes,
): QuoteDialogValues => ({
  customerRef: row.customerRef ?? "",
  ourReference: row.ourReference ?? "",
  requestMethod: row.requestMethod ?? "",
  seller: row.seller ?? "",
  quoteDate: toDateInput(row.quoteDate),
  decisionDate: toDateInput(row.decisionDate),
  priceDate: toDateInput(row.priceDate),
  validUntil: toDateInput(row.validUntil),
  validityPeriodDays:
    row.validityPeriodDays != null ? String(row.validityPeriodDays) : "",
  weightType: row.weightType ?? "",
  deliveryTerms: row.deliveryTerms ?? "",
  paymentTerms: row.paymentTerms ?? "",
  isPickup: row.isPickup ?? false,
  isIncidental: row.isIncidental ?? false,
  isConsignment: row.isConsignment ?? false,
  isOverlength: row.isOverlength ?? false,
  handlingBlocked: row.handlingBlocked ?? false,
  totalWeightKg: row.totalWeightKg ?? "0.00",
  totalExclVat: row.totalExclVat ?? "0.00",
  remarks: row.remarks ?? "",
});

// Empty text/enum/date inputs write NULL so clearing a field works on update;
// empty decimal inputs fall back to the zeroed defaults the legacy form used.
export const quoteValuesToColumns = (
  values: QuoteDialogValues,
): Partial<InsertQuotes> => ({
  customerRef: values.customerRef || null,
  ourReference: values.ourReference || null,
  requestMethod: values.requestMethod || null,
  seller: values.seller || null,
  quoteDate: values.quoteDate ? new Date(values.quoteDate) : null,
  decisionDate: values.decisionDate ? new Date(values.decisionDate) : null,
  priceDate: values.priceDate ? new Date(values.priceDate) : null,
  validUntil: values.validUntil ? new Date(values.validUntil) : null,
  validityPeriodDays: values.validityPeriodDays
    ? Number(values.validityPeriodDays)
    : null,
  weightType: values.weightType || null,
  deliveryTerms: values.deliveryTerms || null,
  paymentTerms: values.paymentTerms || null,
  isPickup: values.isPickup,
  isIncidental: values.isIncidental,
  isConsignment: values.isConsignment,
  isOverlength: values.isOverlength,
  handlingBlocked: values.handlingBlocked,
  totalWeightKg: values.totalWeightKg || "0.00",
  totalExclVat: values.totalExclVat || "0.00",
  remarks: values.remarks || null,
});
