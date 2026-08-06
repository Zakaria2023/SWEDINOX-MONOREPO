import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { returnOrderReasons, returnOrderStatuses } from "@/lib/enums";
import { companyOptionLabel } from "@/lib/helpers";
import {
  RETURN_ORDER_REASON_LABELS,
  RETURN_ORDER_STATUS_LABELS,
} from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

export const returnOrderFilters = (
  companies: CompanyOption[],
): TableFilterControl[] => [
  {
    key: "status",
    kind: "select",
    label: "Status",
    options: returnOrderStatuses.map((status) => ({
      value: status,
      label: RETURN_ORDER_STATUS_LABELS[status],
    })),
  },
  {
    key: "returnReason",
    kind: "select",
    label: "Reason",
    options: returnOrderReasons.map((reason) => ({
      value: reason,
      label: RETURN_ORDER_REASON_LABELS[reason],
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
  { key: "returnDate", kind: "dateRange", label: "Return date" },
];
