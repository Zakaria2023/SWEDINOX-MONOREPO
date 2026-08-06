import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { invoiceDocumentTypes, invoicePaymentTerms } from "@/lib/enums";
import { companyOptionLabel } from "@/lib/helpers";
import {
  INVOICE_DOCUMENT_TYPE_LABELS,
  INVOICE_PAYMENT_TERM_LABELS,
} from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

export const invoiceFilters = (
  companies: CompanyOption[],
): TableFilterControl[] => [
  {
    key: "documentType",
    kind: "select",
    label: "Type",
    options: invoiceDocumentTypes.map((type) => ({
      value: type,
      label: INVOICE_DOCUMENT_TYPE_LABELS[type],
    })),
  },
  {
    key: "company",
    kind: "select",
    label: "Customer",
    placeholder: "All customers",
    options: companies.map((company) => ({
      value: company.uuid,
      label: companyOptionLabel(company),
    })),
  },
  {
    key: "paymentTerms",
    kind: "select",
    label: "Payment terms",
    options: invoicePaymentTerms.map((term) => ({
      value: term,
      label: INVOICE_PAYMENT_TERM_LABELS[term],
    })),
  },
  { key: "invoiceDate", kind: "dateRange", label: "Invoice date" },
  { key: "dueDate", kind: "dateRange", label: "Due date" },
  { key: "outstanding", kind: "numberRange", label: "Outstanding" },
  {
    key: "cancelled",
    kind: "select",
    label: "Cancelled",
    placeholder: "Any",
    options: [
      { value: "false", label: "Not cancelled" },
      { value: "true", label: "Cancelled" },
    ],
  },
];
