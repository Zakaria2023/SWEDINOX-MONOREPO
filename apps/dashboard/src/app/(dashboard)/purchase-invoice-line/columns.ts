import { PurchaseInvoiceLineRow } from "@/app/(dashboard)/purchase-invoice-line/actions";
import { ExportColumn, numberCell, textCell } from "@/lib/excel";

/**
 * Purchase invoice line as a sheet — see app/(dashboard)/orders/columns.ts.
 * The reference's "CBS - IRIS" columns first, then who and what.
 */

export type PurchaseInvoiceLineColumnKey =
  | "year"
  | "month"
  | "purchaseOrder"
  | "lineNumber"
  | "commodityCode"
  | "country"
  | "weightKg"
  | "quantity"
  | "amount"
  | "vatNumber"
  | "invoiceId"
  | "supplierName"
  | "productCode"
  | "productName";

export const PURCHASE_INVOICE_LINE_COLUMNS: Array<
  ExportColumn<PurchaseInvoiceLineRow, PurchaseInvoiceLineColumnKey>
> = [
  {
    key: "year",
    label: "Year",
    defaultVisible: true,
    value: (row) => numberCell(row.year),
  },
  {
    key: "month",
    label: "Month",
    defaultVisible: true,
    value: (row) => numberCell(row.month),
  },
  {
    key: "purchaseOrder",
    label: "Purchase order",
    defaultVisible: true,
    value: (row) =>
      row.purchaseOrderId === null
        ? textCell(row.purchaseOrderNumber)
        : numberCell(row.purchaseOrderId),
  },
  {
    key: "lineNumber",
    label: "Line",
    defaultVisible: true,
    value: (row) => numberCell(row.lineNumber),
  },
  {
    key: "commodityCode",
    label: "CBS no.",
    defaultVisible: true,
    value: (row) => textCell(row.commodityCode),
  },
  {
    key: "country",
    label: "Country",
    defaultVisible: true,
    value: (row) => textCell(row.country),
  },
  {
    key: "weightKg",
    label: "Weight",
    defaultVisible: true,
    value: (row) => numberCell(row.weightKg),
  },
  {
    key: "quantity",
    label: "Qty",
    defaultVisible: true,
    value: (row) => numberCell(row.quantity),
  },
  {
    key: "amount",
    label: "Revenue products",
    defaultVisible: true,
    value: (row) => numberCell(row.amount),
  },
  {
    key: "vatNumber",
    label: "VAT number",
    defaultVisible: true,
    value: (row) => textCell(row.vatNumber),
  },
  {
    key: "invoiceId",
    label: "Invoice",
    defaultVisible: true,
    value: (row) => numberCell(row.invoiceId),
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
    label: "Description",
    defaultVisible: true,
    value: (row) => textCell(row.productName),
  },
];
