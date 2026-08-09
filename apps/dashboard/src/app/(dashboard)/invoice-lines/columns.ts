import { InvoiceLineItem } from "@/app/(dashboard)/invoice-lines/actions";
import { dateCell, ExportColumn, numberCell, textCell } from "@/lib/excel";

/**
 * The invoice lines overview as a sheet — see app/(dashboard)/orders/columns.ts.
 */

export type InvoiceLineColumnKey =
  | "invoiceId"
  | "invoiceDate"
  | "lineNumber"
  | "customerName"
  | "productCode"
  | "productName"
  | "quantity"
  | "weightKg"
  | "amount"
  | "vatNumber";

export const INVOICE_LINE_COLUMNS: Array<
  ExportColumn<InvoiceLineItem, InvoiceLineColumnKey>
> = [
  {
    key: "invoiceId",
    label: "Invoice no.",
    defaultVisible: true,
    // A line whose invoice has gone is still a line; the screen falls back to
    // the line's own id and so does the file.
    value: (row) => row.invoiceId ?? `#${row.id}`,
  },
  {
    key: "invoiceDate",
    label: "Invoice date",
    defaultVisible: true,
    value: (row) => dateCell(row.invoiceDate),
  },
  {
    key: "lineNumber",
    label: "Order line",
    defaultVisible: true,
    value: (row) => numberCell(row.lineNumber),
  },
  {
    key: "customerName",
    label: "Customer",
    defaultVisible: true,
    value: (row) => textCell(row.customerName),
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
    key: "quantity",
    label: "Quantity",
    defaultVisible: true,
    value: (row) => numberCell(row.quantity),
  },
  {
    key: "weightKg",
    label: "Weight (kg)",
    defaultVisible: true,
    value: (row) => numberCell(row.weightKg),
  },
  {
    key: "amount",
    label: "Revenue",
    defaultVisible: true,
    value: (row) => numberCell(row.amount ?? "0.00"),
  },
  {
    key: "vatNumber",
    label: "VAT number",
    defaultVisible: true,
    value: (row) => textCell(row.vatNumber),
  },
];
