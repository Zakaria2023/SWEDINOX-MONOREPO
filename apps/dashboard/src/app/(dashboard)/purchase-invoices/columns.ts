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
    key: "invoiceDate",
    label: "Invoice date",
    defaultVisible: true,
    value: (row) => dateCell(row.invoiceDate),
  },
  {
    key: "id",
    label: "Invoice no.",
    defaultVisible: true,
    value: (row) => row.id,
  },
  {
    key: "expirationDate",
    label: "Expiration date",
    defaultVisible: true,
    value: (row) => dateCell(row.expirationDate),
  },
  {
    key: "creditorNo",
    label: "Creditor no.",
    defaultVisible: true,
    value: (row) => textCell(row.creditorNo),
  },
  {
    key: "invoiceNumberSupplier",
    label: "Invoice no. supplier",
    defaultVisible: true,
    value: (row) => textCell(row.invoiceNumberSupplier),
  },
  {
    key: "supplierCode",
    label: "Supplier code",
    defaultVisible: true,
    value: (row) => numberCell(row.supplierCode),
  },
  {
    key: "companyName",
    label: "Supplier",
    defaultVisible: true,
    value: (row) => textCell(row.companyName),
  },
  {
    key: "city",
    label: "City",
    defaultVisible: true,
    value: (row) => textCell(row.city),
  },
  {
    key: "country",
    label: "Country",
    defaultVisible: true,
    value: (row) => textCell(row.country),
  },
  {
    key: "vatNumber",
    label: "VAT number",
    defaultVisible: true,
    value: (row) => textCell(row.vatNumber),
  },
  {
    key: "invoiceTotal",
    label: "Invoice amount",
    defaultVisible: true,
    value: (row) => numberCell(row.invoiceTotal),
  },
  {
    key: "vatAmount",
    label: "VAT amount",
    defaultVisible: true,
    value: (row) => numberCell(row.vatAmount),
  },
  {
    key: "creditRestriction",
    label: "Credit restriction",
    defaultVisible: true,
    value: (row) => numberCell(row.creditRestriction),
  },
  {
    key: "paymentTermsCode",
    label: "Payment terms code",
    defaultVisible: true,
    value: (row) => textCell(row.paymentTerms),
  },
  {
    key: "paymentTerms",
    label: "Payment terms",
    defaultVisible: true,
    value: (row) =>
      row.paymentTerms ? INVOICE_PAYMENT_TERM_LABELS[row.paymentTerms] : null,
  },
  {
    key: "weightKg",
    label: "Weight",
    defaultVisible: true,
    value: (row) => numberCell(row.weightKg),
  },
  {
    key: "iban",
    label: "IBAN",
    defaultVisible: true,
    value: (row) => textCell(row.iban),
  },
  {
    key: "bankCountry",
    label: "Bank Country",
    defaultVisible: true,
    value: (row) => textCell(row.bankCountry),
  },
  {
    key: "bookingPeriod",
    label: "Booking period",
    defaultVisible: true,
    // `0` until the invoice is made final, then the period it is booked in.
    value: (row) => textCell(String(row.bookingPeriod)),
  },
  {
    key: "status",
    label: "Status",
    defaultVisible: true,
    value: (row) => PURCHASE_INVOICE_STATUS_LABELS[row.status],
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
