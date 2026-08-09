import { PurchaseInvoiceListItem } from "@/app/(dashboard)/purchase-invoices/actions";
import {
  dateCell,
  ExportColumn,
  numberCell,
  textCell,
  yesNoCell,
} from "@/lib/excel";
import {
  INVOICE_PAYMENT_TERM_LABELS,
  PURCHASE_INVOICE_BLOCK_REASON_LABELS,
} from "@/lib/labels";

/**
 * The purchase invoices overview as a sheet — see
 * app/(dashboard)/orders/columns.ts.
 */

export type PurchaseInvoiceColumnKey =
  | "id"
  | "companyName"
  | "sentBy"
  | "supplierCode"
  | "invoiceDate"
  | "expirationDate"
  | "invoiceTotal"
  | "paymentTerms"
  | "blocked"
  | "blockReason";

export const PURCHASE_INVOICE_COLUMNS: Array<
  ExportColumn<PurchaseInvoiceListItem, PurchaseInvoiceColumnKey>
> = [
  { key: "id", label: "No.", defaultVisible: true, value: (row) => row.id },
  {
    key: "companyName",
    label: "Supplier",
    defaultVisible: true,
    value: (row) => textCell(row.companyName),
  },
  {
    key: "sentBy",
    label: "Sent By",
    defaultVisible: true,
    value: (row) =>
      textCell(
        [row.contactFirstName, row.contactLastName].filter(Boolean).join(" "),
      ),
  },
  {
    key: "supplierCode",
    label: "Supplier Code",
    defaultVisible: true,
    value: (row) => numberCell(row.supplierCode),
  },
  {
    key: "invoiceDate",
    label: "Invoice Date",
    defaultVisible: true,
    value: (row) => dateCell(row.invoiceDate),
  },
  {
    key: "expirationDate",
    label: "Exp. Date",
    defaultVisible: true,
    value: (row) => dateCell(row.expirationDate),
  },
  {
    key: "invoiceTotal",
    label: "Total",
    defaultVisible: true,
    value: (row) => numberCell(row.invoiceTotal),
  },
  {
    key: "paymentTerms",
    label: "Payment Terms",
    defaultVisible: true,
    value: (row) =>
      row.paymentTerms ? INVOICE_PAYMENT_TERM_LABELS[row.paymentTerms] : null,
  },
  {
    key: "blocked",
    label: "Blocked",
    defaultVisible: true,
    value: (row) => yesNoCell(row.blocked),
  },
  {
    key: "blockReason",
    label: "Block Reason",
    defaultVisible: true,
    value: (row) =>
      row.blockReason
        ? PURCHASE_INVOICE_BLOCK_REASON_LABELS[row.blockReason]
        : null,
  },
];
