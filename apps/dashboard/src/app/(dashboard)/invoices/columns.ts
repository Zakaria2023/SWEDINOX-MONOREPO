import { InvoiceWithCompany } from "@/app/(dashboard)/invoices/actions";
import {
  dateCell,
  ExportColumn,
  numberCell,
  textCell,
  yesNoCell,
} from "@/lib/excel";
import { invoiceReference } from "@/lib/helpers";
import {
  INVOICE_DOCUMENT_TYPE_LABELS,
  INVOICE_PAYMENT_TERM_LABELS,
  INVOICE_VAT_SCENARIO_LABELS,
} from "@/lib/labels";

/**
 * The invoices overview as a sheet, carrying the reference's columns.
 *
 * `Affiliate company details` is not among them: one constant on all 1 683 of
 * its rows.
 *
 * ⚠️ `Payment terms code` is **not a number of days**. `V` is prepayment, `C`
 * cash, `998` payment in settlement, and the whole `1xx` band is the
 * early-payment discount schemes — 531 of the reference's invoices, a third of
 * them, offer 1–3 % for paying inside 8 to 14 days. Reading the code as an
 * integer works on 1 030 of 1 576 numeric rows and breaks on the rest, which is
 * why `Expiration date` is a stored due date rather than a computed one.
 */

export type InvoiceColumnKey =
  | "documentType"
  | "invoiceDate"
  | "id"
  | "companyCode"
  | "companyName"
  | "streetAndNo"
  | "country"
  | "cocNumber"
  | "invoiceAmountExclVat"
  | "vatAmount"
  | "creditRestriction"
  | "paymentTermsCode"
  | "paymentTerms"
  | "printed"
  | "printedAt"
  | "mailed"
  | "mailedAt"
  | "mailedTo"
  | "outstanding"
  | "debtorNo"
  | "expirationDate"
  | "orderId"
  | "totalWeightKg"
  | "vatNumber"
  | "postalCode"
  | "city"
  | "invoiceAmountInclVat"
  | "invoiceTotal"
  | "vatScenario"
  | "status"
  | "affiliateName";

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
    key: "documentType",
    label: "Type",
    defaultVisible: true,
    value: (row) =>
      textCell(
        row.documentType
          ? INVOICE_DOCUMENT_TYPE_LABELS[row.documentType]
          : null,
      ),
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
    value: (row) => invoiceReference(row.documentType, row.id),
  },
  {
    key: "companyCode",
    label: "Customer code",
    defaultVisible: true,
    value: (row) => numberCell(row.companyCode),
  },
  {
    key: "companyName",
    label: "Customer",
    defaultVisible: true,
    value: (row) => textCell(row.companyName),
  },
  {
    key: "streetAndNo",
    label: "Street + No",
    defaultVisible: false,
    value: (row) => textCell(row.streetAndNo),
  },
  {
    key: "country",
    label: "Country",
    defaultVisible: true,
    value: (row) => textCell(row.country),
  },
  {
    // The Dutch chamber-of-commerce registration.
    key: "cocNumber",
    label: "C. of C. no.",
    defaultVisible: false,
    value: (row) => textCell(row.cocNumber),
  },
  {
    key: "invoiceAmountExclVat",
    label: "Invoice amount",
    defaultVisible: true,
    value: (row) => numberCell(row.invoiceAmountExclVat),
  },
  {
    // The tax itself, which is the difference between the two stored amounts.
    // The reference decides it on the header and the rule is domestic-or-
    // nothing: 21 % in the Netherlands, zero everywhere else.
    key: "vatAmount",
    label: "VAT",
    defaultVisible: true,
    value: (row) =>
      numberCell(
        Number(row.invoiceAmountInclVat ?? 0) -
          Number(row.invoiceAmountExclVat ?? 0),
      ),
  },
  {
    key: "creditRestriction",
    label: "Credit restriction",
    defaultVisible: false,
    value: (row) => numberCell(row.creditRestriction),
  },
  {
    key: "paymentTermsCode",
    label: "Payment terms code",
    defaultVisible: false,
    value: (row) => textCell(row.paymentTerms),
  },
  {
    key: "paymentTerms",
    label: "Payment terms",
    defaultVisible: true,
    value: (row) =>
      textCell(
        row.paymentTerms ? INVOICE_PAYMENT_TERM_LABELS[row.paymentTerms] : null,
      ),
  },
  {
    key: "printed",
    label: "Printed?",
    defaultVisible: true,
    value: (row) => yesNoCell(row.printed),
  },
  {
    key: "printedAt",
    label: "Print date",
    defaultVisible: false,
    value: (row) => dateCell(row.printedAt),
  },
  {
    key: "mailed",
    label: "Mailed?",
    defaultVisible: true,
    value: (row) => yesNoCell(row.mailed),
  },
  {
    key: "mailedAt",
    label: "E-mail date",
    defaultVisible: false,
    value: (row) => dateCell(row.mailedAt),
  },
  {
    key: "mailedTo",
    label: "Email",
    defaultVisible: false,
    value: (row) => textCell(row.mailedTo),
  },
  {
    // Non-zero on 482 of the reference's invoices and equal to the invoice
    // amount on every one of them: an invoice there is open or closed, never
    // part-paid.
    key: "outstanding",
    label: "Outstanding amount",
    defaultVisible: true,
    value: (row) => numberCell(row.outstanding),
  },
  {
    key: "debtorNo",
    label: "Debtor no.",
    defaultVisible: false,
    value: (row) => textCell(row.debtorNo),
  },
  {
    key: "expirationDate",
    label: "Expiration date",
    defaultVisible: true,
    value: (row) => dateCell(row.expirationDate),
  },
  {
    key: "affiliateName",
    label: "Affiliate company details",
    defaultVisible: false,
    value: (row) => textCell(row.affiliateName),
  },
  {
    key: "orderId",
    label: "Order",
    defaultVisible: true,
    value: (row) => numberCell(row.orderId),
  },
  {
    key: "totalWeightKg",
    label: "Kg",
    defaultVisible: false,
    value: (row) => numberCell(row.totalWeightKg),
  },
  {
    key: "vatNumber",
    label: "VAT number",
    defaultVisible: false,
    value: (row) => textCell(row.vatNumber),
  },
  {
    key: "postalCode",
    label: "Postal code",
    defaultVisible: false,
    value: (row) => textCell(row.postalCode),
  },
  {
    key: "city",
    label: "City",
    defaultVisible: true,
    value: (row) => textCell(row.city),
  },
  {
    // Ours alone, and worth keeping: the reference prints only the net amount
    // and the tax, so the gross has to be added up by hand.
    key: "invoiceAmountInclVat",
    label: "Incl. VAT",
    defaultVisible: false,
    value: (row) => numberCell(row.invoiceAmountInclVat),
  },
  {
    key: "invoiceTotal",
    label: "Total",
    defaultVisible: false,
    value: (row) => numberCell(row.invoiceTotal),
  },
  {
    key: "vatScenario",
    label: "VAT scenario",
    defaultVisible: false,
    value: (row) =>
      textCell(
        row.vatScenario ? INVOICE_VAT_SCENARIO_LABELS[row.vatScenario] : null,
      ),
  },
  {
    key: "status",
    label: "Status",
    defaultVisible: false,
    value: (row) => textCell(statusOf(row)),
  },
];
