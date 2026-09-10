import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { invoicePaymentTerms, orderStatuses, orderTypes } from "@/lib/enums";
import { companyOptionLabel } from "@/lib/helpers";
import {
  INVOICE_PAYMENT_TERM_LABELS,
  ORDER_STATUS_LABELS,
  ORDER_TYPE_LABELS,
} from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

export const orderFilters = (
  companies: CompanyOption[],
): TableFilterControl[] => [
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
    key: "orderType",
    kind: "select",
    label: "Order type",
    placeholder: "Any",
    options: orderTypes.map((type) => ({
      value: type,
      label: ORDER_TYPE_LABELS[type],
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
  { key: "deliveryDate", kind: "dateRange", label: "Delivery date" },
  { key: "total", kind: "numberRange", label: "Total incl. VAT" },
  {
    key: "financialBlockage",
    kind: "select",
    label: "Credit hold",
    placeholder: "Any",
    options: [
      { value: "true", label: "Held" },
      { value: "false", label: "Not held" },
    ],
  },
];
