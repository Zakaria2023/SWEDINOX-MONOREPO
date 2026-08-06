import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { counterOrderStatuses } from "@/lib/enums";
import { companyOptionLabel } from "@/lib/helpers";
import { COUNTER_ORDER_STATUS_LABELS } from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

export const counterOrderFilters = (
  companies: CompanyOption[],
): TableFilterControl[] => [
  {
    key: "status",
    kind: "select",
    label: "Status",
    options: counterOrderStatuses.map((status) => ({
      value: status,
      label: COUNTER_ORDER_STATUS_LABELS[status],
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
  { key: "orderDate", kind: "dateRange", label: "Order date" },
];
