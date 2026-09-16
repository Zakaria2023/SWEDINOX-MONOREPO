import { PurchaseReceivalRow } from "@/app/(dashboard)/purchase-receivals/actions";
import {
  dateCell,
  ExportColumn,
  numberCell,
  textCell,
} from "@/lib/excel";
import { formatLengthMm } from "@/lib/helpers";
import {
  ORDER_LINE_STATUS_LABELS,
  RECEIPT_STATUS_LABELS,
  STOCK_UNIT_LABELS,
} from "@/lib/labels";

/**
 * Purchase receivals as a sheet — see app/(dashboard)/orders/columns.ts.
 *
 * The order is the reference system's own. Four of these columns describe the
 * instalment — Kg(p), Kg(a), Delivery date (a) and Receipt status — and the
 * rest describe the purchase line it belongs to, repeating down its
 * instalments.
 */

export type PurchaseReceivalColumnKey =
  | "purchaseOrderCode"
  | "lineNumber"
  | "supplierCode"
  | "supplierName"
  | "purchaseOrderDate"
  | "lineAmount"
  | "qtyPlanned"
  | "unit"
  | "qtyActual"
  | "confirmedQty"
  | "priceQuantity"
  | "invoicedProduction"
  | "options"
  | "lineStatus"
  | "receiptDate"
  | "purchaser"
  | "purchaserInitials"
  | "productCode"
  | "productName"
  | "kgActual"
  | "lengthMm"
  | "receiptStatus"
  | "deliveryDateActual"
  | "deliveryDatePlanned"
  | "kgPlanned";

export const PURCHASE_RECEIVAL_COLUMNS: Array<
  ExportColumn<PurchaseReceivalRow, PurchaseReceivalColumnKey>
> = [
  {
    key: "purchaseOrderCode",
    label: "Purchase order",
    defaultVisible: true,
    value: (row) => textCell(row.purchaseOrderCode),
  },
  {
    key: "lineNumber",
    label: "Line",
    defaultVisible: true,
    value: (row) => numberCell(row.lineNumber),
  },
  {
    key: "supplierCode",
    label: "Supplier code",
    defaultVisible: false,
    value: (row) => textCell(row.supplierCode),
  },
  {
    key: "supplierName",
    label: "Supplier",
    defaultVisible: true,
    value: (row) => textCell(row.supplierName),
  },
  {
    key: "purchaseOrderDate",
    label: "Purchase order date",
    defaultVisible: false,
    value: (row) => dateCell(row.purchaseOrderDate),
  },
  {
    key: "lineAmount",
    label: "Line amount",
    defaultVisible: false,
    value: (row) => numberCell(row.lineAmount),
  },
  {
    key: "qtyPlanned",
    label: "Qty(p)",
    defaultVisible: true,
    value: (row) => numberCell(row.qtyPlanned),
  },
  {
    key: "unit",
    label: "Unit",
    defaultVisible: false,
    value: (row) => textCell(row.unit ? STOCK_UNIT_LABELS[row.unit] : null),
  },
  {
    key: "qtyActual",
    label: "Qty(a)",
    defaultVisible: true,
    value: (row) => numberCell(row.qtyActual),
  },
  {
    key: "confirmedQty",
    label: "Received Qty",
    defaultVisible: false,
    value: (row) => numberCell(row.confirmedQty),
  },
  {
    key: "priceQuantity",
    label: "Price quantity (in gross price U.)",
    defaultVisible: false,
    value: (row) => numberCell(row.priceQuantity),
  },
  {
    // The reference shows one field under two headings, and it is a quantity
    // rather than money however its grid masks it.
    key: "invoicedProduction",
    label: "Invoiced (Prod.)",
    defaultVisible: false,
    value: (row) => numberCell(row.priceQuantity),
  },
  {
    key: "options",
    label: "Options",
    defaultVisible: false,
    value: (row) => textCell(row.options),
  },
  {
    key: "lineStatus",
    label: "Line status",
    defaultVisible: true,
    value: (row) =>
      textCell(row.lineStatus ? ORDER_LINE_STATUS_LABELS[row.lineStatus] : null),
  },
  {
    key: "receiptDate",
    label: "Receipt date",
    defaultVisible: false,
    value: (row) => dateCell(row.receiptDate),
  },
  {
    key: "purchaser",
    label: "Purchaser",
    defaultVisible: false,
    value: (row) => textCell(row.purchaser),
  },
  {
    key: "purchaserInitials",
    label: "Initials",
    defaultVisible: false,
    value: (row) => textCell(row.purchaserInitials),
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
    key: "kgActual",
    label: "Kg(a)",
    defaultVisible: true,
    value: (row) => numberCell(row.kgActual),
  },
  {
    key: "lengthMm",
    label: "Length",
    defaultVisible: false,
    // 999999 is the sentinel for coil, not a 999 metre bar.
    value: (row) => textCell(formatLengthMm(row.lengthMm)),
  },
  {
    key: "receiptStatus",
    label: "Receipt status",
    defaultVisible: true,
    value: (row) =>
      textCell(
        row.receiptStatus ? RECEIPT_STATUS_LABELS[row.receiptStatus] : null,
      ),
  },
  {
    key: "deliveryDateActual",
    label: "Delivery date (a)",
    defaultVisible: true,
    value: (row) => dateCell(row.deliveryDateActual),
  },
  {
    key: "deliveryDatePlanned",
    label: "Delivery date (p)",
    defaultVisible: true,
    value: (row) => dateCell(row.deliveryDatePlanned),
  },
  {
    key: "kgPlanned",
    label: "Kg(p)",
    defaultVisible: true,
    value: (row) => numberCell(row.kgPlanned),
  },
];
