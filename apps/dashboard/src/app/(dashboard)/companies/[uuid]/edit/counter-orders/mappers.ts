import type { CounterOrderDialogValues } from "@/app/(dashboard)/companies/validation";
import type {
  InsertCounterOrders,
  SelectCounterOrders,
} from "@/db/schema/counter-orders";

// The counter order dialog edits only a subset of the CounterOrders columns —
// these two mappers convert between that subset and the stored row. Columns the
// dialog doesn't show (contact/project/address links, logistics, finances) are
// never written on update, so values assigned elsewhere survive later edits.
// `orderDate`/`deliveryDate` are string-mode date columns, so the dialog's
// YYYY-MM-DD strings pass straight through.

export const counterOrderRowToDialogValues = (
  row: SelectCounterOrders,
): CounterOrderDialogValues => ({
  customerRef: row.customerRef ?? "",
  ourReference: row.ourReference ?? "",
  orderMethod: row.orderMethod ?? "",
  seller: row.seller ?? "",
  status: row.status ?? "open",
  priority: row.priority ?? "normal",
  orderDate: row.orderDate ?? "",
  deliveryDate: row.deliveryDate ?? "",
  deliveryTerms: row.deliveryTerms ?? "",
  handlingBlocked: row.handlingBlocked ?? false,
  printPickingSlips: row.printPickingSlips ?? true,
  isPickup: row.isPickup ?? false,
  isIncidental: row.isIncidental ?? false,
  isOverlength: row.isOverlength ?? false,
  amountExVat: row.amountExVat ?? "0.00",
  weightKg: row.weightKg ?? "0.000",
  gainPercent: row.gainPercent ?? "0.00",
  remarks: row.remarks ?? "",
});

// Empty text/enum/date inputs write NULL so clearing a field works on update;
// empty decimal inputs fall back to the zeroed defaults the legacy form used.
export const counterOrderValuesToColumns = (
  values: CounterOrderDialogValues,
): Partial<InsertCounterOrders> => ({
  customerRef: values.customerRef || null,
  ourReference: values.ourReference || null,
  orderMethod: values.orderMethod || null,
  seller: values.seller || null,
  status: values.status,
  priority: values.priority,
  orderDate: values.orderDate || null,
  deliveryDate: values.deliveryDate || null,
  deliveryTerms: values.deliveryTerms || null,
  handlingBlocked: values.handlingBlocked,
  printPickingSlips: values.printPickingSlips,
  isPickup: values.isPickup,
  isIncidental: values.isIncidental,
  isOverlength: values.isOverlength,
  amountExVat: values.amountExVat || "0.00",
  weightKg: values.weightKg || "0.000",
  gainPercent: values.gainPercent || "0.00",
  remarks: values.remarks || null,
});
