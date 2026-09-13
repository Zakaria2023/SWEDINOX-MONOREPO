import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { invoicePaymentTerms, orderStatuses } from "@/lib/enums";
import { companyOptionLabel } from "@/lib/helpers";
import {
  INVOICE_PAYMENT_TERM_LABELS,
  ORDER_STATUS_LABELS,
} from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

export const quoteFilters = (
  companies: CompanyOption[],
): TableFilterControl[] => [
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
  { key: "quoteDate", kind: "dateRange", label: "Quote date" },
  { key: "validUntil", kind: "dateRange", label: "Valid until" },
  { key: "total", kind: "numberRange", label: "Total incl. VAT" },
  {
    key: "status",
    kind: "select",
    label: "Status",
    options: orderStatuses.map((status) => ({
      value: status,
      label: ORDER_STATUS_LABELS[status],
    })),
  },
  {
    key: "expired",
    kind: "select",
    label: "Expired",
    placeholder: "Any",
    options: [
      { value: "false", label: "Still valid" },
      { value: "true", label: "Expired" },
    ],
  },
];
