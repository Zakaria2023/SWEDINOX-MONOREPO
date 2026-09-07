import { PurchaseLineItem } from "@/app/(dashboard)/purchase-lines/actions";
import { dateCell, ExportColumn, numberCell, textCell } from "@/lib/excel";
import { ORDER_LINE_STATUS_LABELS, STOCK_UNIT_LABELS } from "@/lib/labels";
import { COIL_LENGTH_SENTINEL } from "@/lib/helpers";

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
  | "qtyReceived"
  | "kgActual"
  | "kgStillToReceive"
  | "availableQty"
  | "availableKg"
  | "thicknessMm"
  | "netPrice"
  | "priceUnit"
  | "amount"
  | "amountYetToBeReceived"
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
    label: "Length (mm)",
    defaultVisible: true,
    // 999999 is the reference's mark for coil, not a 999 metre bar.
    value: (row) =>
      row.lengthMm === COIL_LENGTH_SENTINEL ? null : numberCell(row.lengthMm),
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
    key: "qtyReceived",
    label: "Qty(a) (Pur.U.)",
    defaultVisible: true,
    value: (row) => numberCell(row.qtyReceived),
  },
  {
    key: "kgActual",
    label: "Kg(a)",
    defaultVisible: true,
    value: (row) => numberCell(row.kgActual),
  },
  {
    key: "kgStillToReceive",
    label: "Kg. still to be received",
    defaultVisible: true,
    value: (row) => numberCell(row.kgStillToReceive),
  },
  {
    key: "availableQty",
    label: "Available (Pur.U.)",
    defaultVisible: true,
    value: (row) => numberCell(row.availableQty),
  },
  {
    key: "availableKg",
    label: "Available (kg)",
    defaultVisible: false,
    value: (row) => numberCell(row.availableKg),
  },
  {
    key: "thicknessMm",
    label: "Thickness",
    defaultVisible: false,
    value: (row) => numberCell(row.thicknessMm),
  },
  {
    key: "netPrice",
    label: "Net Purchase Price",
    defaultVisible: true,
    value: (row) => numberCell(row.netPrice),
  },
  {
    key: "priceUnit",
    label: "PriceU",
    defaultVisible: true,
    value: (row) => textCell(row.priceUnit),
  },
  {
    key: "amount",
    label: "Amount(p)",
    defaultVisible: true,
    value: (row) => numberCell(row.amount),
  },
  {
    key: "amountYetToBeReceived",
    label: "Amount yet to be received",
    defaultVisible: true,
    value: (row) => numberCell(row.amountYetToBeReceived),
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
