import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { orderSourceTypes } from "@/lib/enums";
import { companyOptionLabel } from "@/lib/helpers";
import { ORDER_SOURCE_TYPE_LABELS } from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

/**
 * `Linetype` comes first because it is the split that defines this screen: an
 * order line and a surcharge line share an invoice and almost nothing else.
 */
export const invoiceLineFilters = (
  companies: CompanyOption[],
): TableFilterControl[] => [
  {
    key: "lineType",
    kind: "select",
    label: "Linetype",
    placeholder: "Order and surcharge lines",
    options: [
      { value: "orderline", label: "Orderline" },
      { value: "surcharge", label: "Surcharge" },
    ],
  },
  { key: "invoiceDate", kind: "dateRange", label: "Invoice date" },
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
    // Order lines only: a surcharge has no supply route, so choosing one hides
    // them rather than pretending they are stock.
    key: "orderType",
    kind: "select",
    label: "Supply",
    placeholder: "Stock and direct",
    options: orderSourceTypes.map((type) => ({
      value: type,
      label: ORDER_SOURCE_TYPE_LABELS[type],
    })),
  },
];
