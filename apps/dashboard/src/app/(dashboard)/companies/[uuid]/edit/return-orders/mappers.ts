import type { ReturnOrderDialogValues } from "@/app/(dashboard)/companies/validation";
import type {
  InsertReturnOrders,
  SelectReturnOrders,
} from "@/db/schema/return-orders";

// The return order dialog edits only a subset of the ReturnOrders columns —
// these two mappers convert between that subset and the stored row. Columns
// the dialog doesn't show (order/contact/address links, reception, logistics,
// the computed summary snapshot) are never written on update, so values
// assigned elsewhere survive later edits. `orderDate` is a string-mode date
// column, so the dialog's YYYY-MM-DD string passes straight through.

export const returnOrderRowToDialogValues = (
  row: SelectReturnOrders,
): ReturnOrderDialogValues => ({
  orderReference: row.orderReference ?? "",
  customerRef: row.customerRef ?? "",
  ourReference: row.ourReference ?? "",
  status: row.status ?? "open",
  orderDate: row.orderDate ?? "",
  complaintRef: row.complaintRef ?? "",
  // Rows created before the reason became required may have none stored; the
  // dialog then starts on its "Select reason" placeholder, same as the legacy
  // edit flow.
  returnReason:
    row.returnReason ?? ("" as ReturnOrderDialogValues["returnReason"]),
  totalWeightKg: row.totalWeightKg ?? "0.00",
  totalExclVat: row.totalExclVat ?? "0.00",
  handlingBlocked: row.handlingBlocked ?? false,
  remarks: row.remarks ?? "",
});

// Empty text/date inputs write NULL so clearing a field works on update; empty
// decimal inputs fall back to the zeroed defaults the legacy form used.
// `returnReason` is required by the dialog schema, so it always holds a value.
export const returnOrderValuesToColumns = (
  values: ReturnOrderDialogValues,
): Partial<InsertReturnOrders> => ({
  orderReference: values.orderReference || null,
  customerRef: values.customerRef || null,
  ourReference: values.ourReference || null,
  status: values.status,
  orderDate: values.orderDate || null,
  complaintRef: values.complaintRef || null,
  returnReason: values.returnReason,
  totalWeightKg: values.totalWeightKg || "0.00",
  totalExclVat: values.totalExclVat || "0.00",
  handlingBlocked: values.handlingBlocked,
  remarks: values.remarks || null,
});
