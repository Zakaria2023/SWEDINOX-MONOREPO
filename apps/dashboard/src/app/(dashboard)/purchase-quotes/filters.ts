import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { purchaseQuoteStatuses } from "@/lib/enums";
import { companyOptionLabel } from "@/lib/helpers";
import { PURCHASE_QUOTE_STATUS_LABELS } from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

export const purchaseQuoteFilters = (
  companies: CompanyOption[],
): TableFilterControl[] => [
  { key: "quoteDate", kind: "dateRange", label: "Quote date" },
  {
    key: "status",
    kind: "select",
    label: "Status",
    placeholder: "All statuses",
    options: purchaseQuoteStatuses.map((status) => ({
      value: status,
      label: PURCHASE_QUOTE_STATUS_LABELS[status],
    })),
  },
  {
    key: "supplier",
    kind: "select",
    label: "Supplier",
    placeholder: "All suppliers",
    options: companies
      .filter(
        (company) =>
          company.roles?.includes("supplier") ||
          company.roles?.includes("agent"),
      )
      .map((company) => ({
        value: company.uuid,
        label: companyOptionLabel(company),
      })),
  },
];
