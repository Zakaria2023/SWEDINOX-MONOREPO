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
  PURCHASE_INVOICE_STATUS_LABELS,
} from "@/lib/labels";

/**
 * The purchase invoices overview as a sheet — see
 * app/(dashboard)/orders/columns.ts.
 */

export type PurchaseInvoiceColumnKey =
  | "createdAt"
  | "status"
  | "id"
  | "companyName"
  | "sentBy"
  | "sentByCompanyName"
  | "supplierCode"
  | "invoiceNumberSupplier"
  | "creditorNo"
  | "city"
  | "country"
  | "vatNumber"
  | "invoiceDate"
  | "expirationDate"
  | "bookingPeriod"
  | "invoiceTotal"
  | "vatAmount"
  | "creditRestriction"
  | "weightKg"
  | "iban"
  | "bankCountry"
  | "paymentTermsCode"
  | "paymentTerms"
  | "blocked"
  | "blockReason";

export const PURCHASE_INVOICE_COLUMNS: Array<
  ExportColumn<PurchaseInvoiceListItem, PurchaseInvoiceColumnKey>
> = [
  {
    key: "createdAt",
    label: "Creation date",
    defaultVisible: true,
    value: (row) => dateCell(row.createdAt),
  },
  {
    key: "status",
    label: "Status",
    defaultVisible: true,
    value: (row) => PURCHASE_INVOICE_STATUS_LABELS[row.status],
  },
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
    key: "sentByCompanyName",
    label: "Invoice sent by",
    defaultVisible: false,
    value: (row) => textCell(row.sentByCompanyName),
  },
  {
    key: "supplierCode",
    label: "Supplier Code",
    defaultVisible: true,
    value: (row) => numberCell(row.supplierCode),
  },
  {
    key: "invoiceNumberSupplier",
    label: "Invoice no. supplier",
    defaultVisible: true,
    value: (row) => textCell(row.invoiceNumberSupplier),
  },
  {
    key: "creditorNo",
    label: "Creditor no.",
    defaultVisible: false,
    value: (row) => textCell(row.creditorNo),
  },
  {
    key: "city",
    label: "City",
    defaultVisible: false,
    value: (row) => textCell(row.city),
  },
  {
    key: "country",
    label: "Country",
    defaultVisible: false,
    value: (row) => textCell(row.country),
  },
  {
    key: "vatNumber",
    label: "VAT number",
    defaultVisible: false,
    value: (row) => textCell(row.vatNumber),
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
    key: "bookingPeriod",
    label: "Booking period",
    defaultVisible: false,
    value: (row) => textCell(row.bookingPeriod),
  },
  {
    key: "invoiceTotal",
    label: "Total",
    defaultVisible: true,
    value: (row) => numberCell(row.invoiceTotal),
  },
  {
    key: "vatAmount",
    label: "VAT amount",
    defaultVisible: false,
    value: (row) => numberCell(row.vatAmount),
  },
  {
    key: "creditRestriction",
    label: "Credit restriction",
    defaultVisible: false,
    value: (row) => numberCell(row.creditRestriction),
  },
  {
    key: "weightKg",
    label: "Weight",
    defaultVisible: false,
    value: (row) => numberCell(row.weightKg),
  },
  {
    key: "iban",
    label: "IBAN",
    defaultVisible: false,
    value: (row) => textCell(row.iban),
  },
  {
    key: "bankCountry",
    label: "Bank country",
    defaultVisible: false,
    value: (row) => textCell(row.bankCountry),
  },
  {
    key: "paymentTermsCode",
    label: "Payment terms code",
    defaultVisible: false,
    value: (row) => textCell(row.paymentTerms),
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
