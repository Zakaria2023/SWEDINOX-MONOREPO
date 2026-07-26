import type { PurchaseOrderDialogValues } from "@/app/(dashboard)/companies/validation";
import type {
  InsertPurchaseOrders,
  SelectPurchaseOrders,
} from "@/db/schema/purchase-orders";

// The purchase-order dialog edits only a subset of the PurchaseOrders columns —
// these two mappers convert between that subset and the stored row. Columns the
// dialog doesn't show (purchaser, delivery/logistics details, documents) are
// never written on update, so values assigned elsewhere survive edits here.

export const purchaseOrderRowToDialogValues = (
  row: SelectPurchaseOrders,
): PurchaseOrderDialogValues => ({
  status: row.status,
  purchaseOrderType: row.purchaseOrderType ?? "",
  forOrder: row.forOrder ?? "",
  orderDate: row.orderDate ?? "",
  deliveryDate: row.deliveryDate
    ? new Date(row.deliveryDate).toISOString().split("T")[0]
    : "",
  amount: row.amount,
  weightKg: row.weightKg,
  confirmationReference: row.confirmationReference ?? "",
  confirmationDate: row.confirmationDate ?? "",
  copiedFrom: row.copiedFrom ?? "",
  internalReference: row.internalReference ?? "",
  reference: row.reference ?? "",
  inkoper: row.inkoper ?? "",
  purchaserInitials: row.purchaserInitials ?? "",
  isPrinted: row.isPrinted ?? false,
  isMailed: row.isMailed ?? false,
  arrangeTransport: row.arrangeTransport ?? false,
  pickupDropoffCdPurchases: row.pickupDropoffCdPurchases ?? false,
  isOverlength: row.isOverlength ?? false,
  remarks: row.remarks ?? "",
});

// Empty strings clear their column on update; the decimal columns fall back to
// the same "0.00" / "0.000" defaults the legacy save handler applied.
export const purchaseOrderValuesToColumns = (
  values: PurchaseOrderDialogValues,
): Partial<InsertPurchaseOrders> => ({
  status: values.status,
  purchaseOrderType: (values.purchaseOrderType ||
    null) as InsertPurchaseOrders["purchaseOrderType"],
  forOrder: values.forOrder || null,
  orderDate: values.orderDate || null,
  deliveryDate: values.deliveryDate ? new Date(values.deliveryDate) : null,
  amount: values.amount || "0.00",
  weightKg: values.weightKg || "0.000",
  confirmationReference: values.confirmationReference || null,
  confirmationDate: values.confirmationDate || null,
  copiedFrom: values.copiedFrom || null,
  internalReference: values.internalReference || null,
  reference: values.reference || null,
  inkoper: values.inkoper || null,
  purchaserInitials: values.purchaserInitials || null,
  isPrinted: values.isPrinted,
  isMailed: values.isMailed,
  arrangeTransport: values.arrangeTransport,
  pickupDropoffCdPurchases: values.pickupDropoffCdPurchases,
  isOverlength: values.isOverlength,
  remarks: values.remarks || null,
});
