import { ComplaintDetail } from "@/app/(dashboard)/complaints/actions";
import { ComplaintFormValues } from "@/app/(dashboard)/complaints/validation";
import { toDateInput, toFormString } from "@/lib/helpers";

/**
 * A saved complaint back into the values its form edits. The status history is
 * absent by design: it is appended to when the status moves, never edited.
 */
export const complaintDetailToFormValues = (
  complaint: ComplaintDetail,
): ComplaintFormValues => ({
  companyUuid: complaint.companyUuid,
  contactUuid: toFormString(complaint.contactUuid),
  complaintType: complaint.complaintType ?? undefined,
  documentUuid: toFormString(
    complaint.orderUuid ??
      complaint.quoteUuid ??
      complaint.counterOrderUuid ??
      complaint.purchaseOrderUuid ??
      complaint.purchaseQuoteUuid ??
      complaint.returnOrderUuid,
  ),
  report: complaint.report ?? undefined,
  reportDate: toDateInput(complaint.reportDate),
  description: toFormString(complaint.description),
  category: complaint.category ?? undefined,
  productUuid: toFormString(complaint.productUuid),
  qty: toFormString(complaint.qty, "0.000"),
  qtyUnit: complaint.qtyUnit ?? undefined,
  amount: toFormString(complaint.amount, "0.00"),
  weight: toFormString(complaint.weight, "0.000"),

  status: complaint.status ?? "new",
  responsibleUserId: toFormString(complaint.responsibleUserId),
  deadline: toDateInput(complaint.deadline),
  cause: complaint.cause ?? undefined,
  explanationOfCause: toFormString(complaint.explanationOfCause),
  solution: complaint.solution ?? undefined,
  explanationOfSolution: toFormString(complaint.explanationOfSolution),

  costsCustomer: toFormString(complaint.costsCustomer, "0.00"),
  costsCustomerNote: toFormString(complaint.costsCustomerNote),
  internalCosts: toFormString(complaint.internalCosts, "0.00"),
  internalCostsNote: toFormString(complaint.internalCostsNote),
  extraCosts: toFormString(complaint.extraCosts, "0.00"),
  extraCostsNote: toFormString(complaint.extraCostsNote),
  toBeReclaimed: toFormString(complaint.toBeReclaimed, "0.00"),
  toBeReclaimedNote: toFormString(complaint.toBeReclaimedNote),

  documents: complaint.documents ?? [],
});
