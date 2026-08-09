import { InvoiceWithCompany } from "@/app/(dashboard)/invoices/actions";
import { dateCell, ExportColumn, numberCell, textCell } from "@/lib/excel";
import { invoiceReference } from "@/lib/helpers";
import {
  INVOICE_DOCUMENT_TYPE_LABELS,
  INVOICE_PAYMENT_TERM_LABELS,
  INVOICE_VAT_SCENARIO_LABELS,
} from "@/lib/labels";

/** The invoices overview as a sheet — see app/(dashboard)/orders/columns.ts. */

export type InvoiceColumnKey =
  | "id"
  | "documentType"
  | "companyName"
  | "companyCode"
  | "invoiceDate"
  | "expirationDate"
  | "invoiceAmountExclVat"
  | "invoiceAmountInclVat"
  | "creditRestriction"
  | "invoiceTotal"
  | "outstanding"
  | "vatScenario"
  | "paymentTerms"
  | "status";

/**
 * The badges the status column carries, as words.
 *
 * The screen shows them as coloured pills and shows a dash when none apply; the
 * sheet joins whichever are set, so the column can be filtered on in Excel.
 */
const statusOf = (invoice: InvoiceWithCompany): string | null => {
  const flags = [
    invoice.calculateVat ? "VAT" : null,
    invoice.printed ? "Printed" : null,
    invoice.mailed ? "Mailed" : null,
  ].filter(Boolean);
  return flags.length > 0 ? flags.join(", ") : null;
};

export const INVOICE_COLUMNS: Array<
  ExportColumn<InvoiceWithCompany, InvoiceColumnKey>
> = [
  {
    key: "id",
    label: "Document No.",
    defaultVisible: true,
    value: (row) => invoiceReference(row.documentType, row.id),
  },
  {
    key: "documentType",
    label: "Document",
    defaultVisible: true,
    value: (row) =>
      row.documentType === "credit_note"
        ? INVOICE_DOCUMENT_TYPE_LABELS.credit_note
        : INVOICE_DOCUMENT_TYPE_LABELS.invoice,
  },
  {
    key: "companyName",
    label: "Customer",
    defaultVisible: true,
    value: (row) => textCell(row.companyName),
  },
  {
    key: "companyCode",
    label: "Customer Code",
    defaultVisible: true,
    value: (row) => numberCell(row.companyCode),
  },
  {
    key: "invoiceDate",
    label: "Invoice Date",
    defaultVisible: true,
    value: (row) => dateCell(row.invoiceDate),
  },
  {
    key: "expirationDate",
    label: "Expiration Date",
    defaultVisible: true,
    value: (row) => dateCell(row.expirationDate),
  },
  {
    key: "invoiceAmountExclVat",
    label: "Excl. VAT",
    defaultVisible: true,
    value: (row) => numberCell(row.invoiceAmountExclVat),
  },
  {
    key: "invoiceAmountInclVat",
    label: "Incl. VAT",
    defaultVisible: true,
    value: (row) => numberCell(row.invoiceAmountInclVat),
  },
  {
    key: "creditRestriction",
    label: "Credit Restriction",
    defaultVisible: false,
    value: (row) => numberCell(row.creditRestriction),
  },
  {
    key: "invoiceTotal",
    label: "Total",
    defaultVisible: true,
    value: (row) => numberCell(row.invoiceTotal),
  },
  {
    key: "outstanding",
    label: "Outstanding",
    defaultVisible: true,
    value: (row) => numberCell(row.outstanding),
  },
  {
    key: "vatScenario",
    label: "VAT Scenario",
    defaultVisible: true,
    value: (row) =>
      row.vatScenario ? INVOICE_VAT_SCENARIO_LABELS[row.vatScenario] : null,
  },
  {
    key: "paymentTerms",
    label: "Payment Terms",
    defaultVisible: true,
    value: (row) =>
      row.paymentTerms ? INVOICE_PAYMENT_TERM_LABELS[row.paymentTerms] : null,
  },
  {
    key: "status",
    label: "Status",
    defaultVisible: true,
    value: (row) => statusOf(row),
  },
];
