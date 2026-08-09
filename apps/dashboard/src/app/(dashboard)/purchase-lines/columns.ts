import { PurchaseLineItem } from "@/app/(dashboard)/purchase-lines/actions";
import { dateCell, ExportColumn, numberCell, textCell } from "@/lib/excel";
import { ORDER_LINE_STATUS_LABELS, STOCK_UNIT_LABELS } from "@/lib/labels";

/**
 * The purchase lines overview as a sheet — see app/(dashboard)/orders/columns.ts.
 */

export type PurchaseLineColumnKey =
  | "createdAt"
  | "purchaseOrderId"
  | "lineNumber"
  | "status"
  | "supplierName"
  | "productCode"
  | "productName"
  | "qualityCode"
  | "stockCategory"
  | "options"
  | "lengthMm"
  | "widthMm"
  | "qtyPlanned"
  | "unit"
  | "reservedQty"
  | "kgPurchased"
  | "receiptDate"
  | "purchaser";

export const PURCHASE_LINE_COLUMNS: Array<
  ExportColumn<PurchaseLineItem, PurchaseLineColumnKey>
> = [
  {
    key: "createdAt",
    label: "Date created",
    defaultVisible: true,
    value: (row) => dateCell(row.createdAt),
  },
  {
    key: "purchaseOrderId",
    label: "Purchase order",
    defaultVisible: true,
    value: (row) => row.purchaseOrderId ?? `#${row.id}`,
  },
  {
    key: "lineNumber",
    label: "Line",
    defaultVisible: true,
    value: (row) => numberCell(row.lineNumber),
  },
  {
    key: "status",
    label: "Status",
    defaultVisible: true,
    value: (row) => (row.status ? ORDER_LINE_STATUS_LABELS[row.status] : null),
  },
  {
    key: "supplierName",
    label: "Supplier",
    defaultVisible: true,
    value: (row) => textCell(row.supplierName),
  },
  {
    key: "productCode",
    label: "Product code",
    defaultVisible: true,
    value: (row) => textCell(row.productCode),
  },
  {
    key: "productName",
    label: "Product",
    defaultVisible: true,
    value: (row) => textCell(row.productName),
  },
  {
    key: "qualityCode",
    label: "Quality",
    defaultVisible: true,
    value: (row) => textCell(row.qualityCode),
  },
  {
    key: "stockCategory",
    label: "Stock category",
    defaultVisible: true,
    value: (row) => textCell(row.stockCategory),
  },
  {
    key: "options",
    label: "Options",
    defaultVisible: true,
    value: (row) => textCell(row.options),
  },
  {
    key: "lengthMm",
    label: "Length",
    defaultVisible: true,
    value: (row) => numberCell(row.lengthMm),
  },
  {
    key: "widthMm",
    label: "Width",
    defaultVisible: true,
    value: (row) => numberCell(row.widthMm),
  },
  {
    key: "qtyPlanned",
    label: "Qty(p)",
    defaultVisible: true,
    value: (row) => numberCell(row.qtyPlanned),
  },
  {
    key: "unit",
    label: "U",
    defaultVisible: true,
    value: (row) => (row.unit ? STOCK_UNIT_LABELS[row.unit] : null),
  },
  {
    key: "reservedQty",
    label: "Reserved",
    defaultVisible: true,
    value: (row) => numberCell(row.reservedQty),
  },
  {
    key: "kgPurchased",
    label: "Kg(pur)",
    defaultVisible: true,
    value: (row) => numberCell(row.kgPurchased),
  },
  {
    key: "receiptDate",
    label: "Receipt date",
    defaultVisible: true,
    value: (row) => dateCell(row.receiptDate),
  },
  {
    key: "purchaser",
    label: "Purchaser",
    defaultVisible: true,
    value: (row) => textCell(row.purchaser),
  },
];
