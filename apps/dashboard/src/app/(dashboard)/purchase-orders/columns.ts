import { PurchaseOrderListItem } from "@/app/(dashboard)/purchase-orders/actions";
import { PurchaseOrderType } from "@/lib/enums";
import { dateCell, ExportColumn, textCell } from "@/lib/excel";
import { PURCHASE_ORDER_TYPE_LABELS } from "@/lib/labels";

/**
 * The purchase orders overview as a sheet — see app/(dashboard)/orders/columns.ts.
 */

export type PurchaseOrderColumnKey =
  | "id"
  | "supplierName"
  | "contact"
  | "purchaseOrderType"
  | "deliveryDate"
  | "createdAt";

export const PURCHASE_ORDER_COLUMNS: Array<
  ExportColumn<PurchaseOrderListItem, PurchaseOrderColumnKey>
> = [
  { key: "id", label: "#", defaultVisible: true, value: (row) => row.id },
  {
    key: "supplierName",
    label: "Supplier",
    defaultVisible: true,
    value: (row) => textCell(row.supplierName),
  },
  {
    key: "contact",
    label: "Contact",
    defaultVisible: true,
    value: (row) =>
      textCell(
        [row.contactFirstName, row.contactLastName].filter(Boolean).join(" "),
      ),
  },
  {
    key: "purchaseOrderType",
    label: "Type",
    defaultVisible: true,
    value: (row) =>
      row.purchaseOrderType
        ? (PURCHASE_ORDER_TYPE_LABELS[
            row.purchaseOrderType as PurchaseOrderType
          ] ?? row.purchaseOrderType)
        : null,
  },
  {
    key: "deliveryDate",
    label: "Delivery Date",
    defaultVisible: true,
    // As on screen: the delivery week stands in when no day is fixed.
    value: (row) =>
      row.deliveryDate
        ? dateCell(row.deliveryDate)
        : row.deliveryWeek && row.deliveryYear
          ? `W${row.deliveryWeek} ${row.deliveryYear}`
          : null,
  },
  {
    key: "createdAt",
    label: "Created",
    defaultVisible: true,
    value: (row) => dateCell(row.createdAt),
  },
];
